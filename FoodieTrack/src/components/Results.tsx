export default function Results({ results }: { results: any }) {
        const displayValue = typeof results === 'object' && results !== null 
        ? JSON.stringify(results) 
        : results;
    return (
        <div className="results-container">
            <p>{displayValue}</p>
        </div>
    )
}