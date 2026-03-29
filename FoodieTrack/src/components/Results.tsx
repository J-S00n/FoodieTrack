type ResultsProps = {
  results: any;
};

export default function Results({ results }: ResultsProps) {
  return (
    <div className="w-full max-w-2xl mt-10 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Recommended for you
      </h3>

      <pre className="text-sm text-slate-700 whitespace-pre-wrap">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  );
}