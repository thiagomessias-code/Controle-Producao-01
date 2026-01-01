import React from 'react';

export const AdminPlaceholder: React.FC<{ title: string }> = ({ title }) => (
    <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500">Módulo em construção...</p>
    </div>
);
