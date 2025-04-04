import React from 'react';

export const Spinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <div className="w-[50px] h-[50px] border-[5px] border-gray-200 border-t-[5px] border-t-indigo-500 rounded-full animate-spin"></div>
    <p className="mt-4 text-slate-500 text-xl">加载中...</p>
  </div>
);