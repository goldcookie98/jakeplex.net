import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(fs.readFileSync('.env'));

const pushEnv = (key, value) => {
    console.log(`Pushing ${key}...`);
    try {
        // Ignore failure if it doesn't exist
        execSync(`npx vercel env rm ${key} -y`, { stdio: 'ignore' });
    } catch (e) { }

    try {
        // Write exactly the raw string to stdin for vercel to read
        execSync(`npx vercel env add ${key} production`, {
            input: value,
            stdio: ['pipe', 'inherit', 'inherit']
        });
        console.log(`Successfully pushed ${key}`);
    } catch (e) {
        console.error(`Failed to push ${key}: ${e.message}`);
    }
};

pushEnv('FIREBASE_PROJECT_ID', envConfig.FIREBASE_PROJECT_ID);
pushEnv('FIREBASE_CLIENT_EMAIL', envConfig.FIREBASE_CLIENT_EMAIL);
pushEnv('FIREBASE_PRIVATE_KEY', envConfig.FIREBASE_PRIVATE_KEY);
console.log("Done.");
