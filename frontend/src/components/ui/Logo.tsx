import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`flex items-center gap-2 font-bold tracking-tighter ${className}`}>
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-xl">M</span>
            </div>
            <span className="text-2xl text-foreground">MESA</span>
        </div>
    );
};
