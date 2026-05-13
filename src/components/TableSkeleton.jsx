import React from 'react';

const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="animate-pulse">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {[...Array(columns)].map((_, i) => (
              <th key={i} className="px-6 py-3 text-left">
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {[...Array(rows)].map((_, i) => (
            <tr key={i}>
              {[...Array(columns)].map((_, j) => (
                <td key={j} className="px-6 py-4">
                  {j === 0 ? (
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-200 mr-3"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="h-3 bg-slate-100 rounded w-32"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-20"></div>
                      <div className="h-3 bg-slate-100 rounded w-16"></div>
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSkeleton;
