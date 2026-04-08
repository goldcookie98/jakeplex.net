import SearchBar from '../components/SearchBar';
import RecentlyAdded from '../components/RecentlyAdded';

export default function Home() {
    return (
        <div className="page">
            <div className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">JakePlex</h1>
                    <SearchBar autoFocus />
                    <RecentlyAdded />
                </div>
            </div>
        </div>
    );
}
