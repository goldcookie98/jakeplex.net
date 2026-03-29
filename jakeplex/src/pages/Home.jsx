import SearchBar from '../components/SearchBar';
import RecentlyAdded from '../components/RecentlyAdded';

export default function Home() {
    return (
        <div className="page">
            <div className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">JakePlex</h1>
                    <p className="hero-subtitle">
                        Search for any movie or TV show and request it to be added to the library
                    </p>
                    <SearchBar autoFocus />
                    <RecentlyAdded />
                </div>
            </div>
        </div>
    );
}
