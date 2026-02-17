
import React from 'react';

interface Bhava {
    number: number;
    rashi: number;
    planets: string[];
}

interface KundaliChartProps {
    houses: Bhava[];
    ascendantRashi: number;
}

const KundaliChart: React.FC<KundaliChartProps> = ({ houses, ascendantRashi }) => {
    // North Indian Kundli Path data for a 300x300 square
    // Center is 150, 150

    const size = 300;
    const mid = size / 2;

    const housePaths = [
        // House 1 (Top Center Diamond)
        `M ${mid} ${mid} L ${mid / 2} ${mid / 2} L ${mid} 0 L ${mid * 1.5} ${mid / 2} Z`,
        // House 2 (Top Left Triangle)
        `M 0 0 L ${mid} 0 L ${mid / 2} ${mid / 2} Z`,
        // House 3 (Left Top Triangle)
        `M 0 0 L ${mid / 2} ${mid / 2} L 0 ${mid} Z`,
        // House 4 (Left Center Diamond)
        `M ${mid} ${mid} L ${mid / 2} ${mid / 2} L 0 ${mid} L ${mid / 2} ${mid * 1.5} Z`,
        // House 5 (Left Bottom Triangle)
        `M 0 ${size} L 0 ${mid} L ${mid / 2} ${mid * 1.5} Z`,
        // House 6 (Bottom Left Triangle)
        `M 0 ${size} L ${mid / 2} ${mid * 1.5} L ${mid} ${size} Z`,
        // House 7 (Bottom Center Diamond)
        `M ${mid} ${mid} L ${mid / 2} ${mid * 1.5} L ${mid} ${size} L ${mid * 1.5} ${mid * 1.5} Z`,
        // House 8 (Bottom Right Triangle)
        `M ${size} ${size} L ${mid} ${size} L ${mid * 1.5} ${mid * 1.5} Z`,
        // House 9 (Right Bottom Triangle)
        `M ${size} ${size} L ${mid * 1.5} ${mid * 1.5} L ${size} ${mid} Z`,
        // House 10 (Right Center Diamond)
        `M ${mid} ${mid} L ${mid * 1.5} ${mid * 1.5} L ${size} ${mid} L ${mid * 1.5} ${mid / 2} Z`,
        // House 11 (Right Top Triangle)
        `M ${size} 0 L ${size} ${mid} L ${mid * 1.5} ${mid / 2} Z`,
        // House 12 (Top Right Triangle)
        `M ${size} 0 L ${mid * 1.5} ${mid / 2} L ${mid} 0 Z`,
    ];

    const housePositions = [
        { r: { x: 150, y: 35 }, p: { x: 150, y: 90 } },  // H1
        { r: { x: 75, y: 25 }, p: { x: 75, y: 70 } },   // H2
        { r: { x: 25, y: 75 }, p: { x: 70, y: 75 } },   // H3
        { r: { x: 35, y: 150 }, p: { x: 90, y: 150 } }, // H4
        { r: { x: 25, y: 225 }, p: { x: 70, y: 225 } },  // H5
        { r: { x: 75, y: 275 }, p: { x: 75, y: 230 } },  // H6
        { r: { x: 150, y: 265 }, p: { x: 150, y: 210 } }, // H7
        { r: { x: 225, y: 275 }, p: { x: 225, y: 230 } }, // H8
        { r: { x: 275, y: 225 }, p: { x: 230, y: 225 } }, // H9
        { r: { x: 265, y: 150 }, p: { x: 210, y: 150 } }, // H10
        { r: { x: 275, y: 75 }, p: { x: 230, y: 75 } },  // H11
        { r: { x: 225, y: 25 }, p: { x: 225, y: 70 } },  // H12
    ];

    const planetAbbr: Record<string, string> = {
        'sun': 'Su', 'moon': 'Mo', 'mars': 'Ma', 'mercury': 'Me',
        'jupiter': 'Ju', 'venus': 'Ve', 'saturn': 'Sa', 'rahu': 'Ra', 'ketu': 'Ke'
    };

    const getPlanetColor = (p: string) => {
        switch (p.toLowerCase()) {
            case 'sun': return '#F59E0B';
            case 'moon': return '#60A5FA';
            case 'mars': return '#EF4444';
            case 'mercury': return '#10B981';
            case 'jupiter': return '#8B5CF6';
            case 'venus': return '#EC4899';
            case 'saturn': return '#4B5563';
            case 'rahu': return '#78350F';
            case 'ketu': return '#374151';
            default: return '#6B7280';
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '20px 0',
            padding: '20px',
            background: 'var(--color-bg-card)',
            borderRadius: '24px',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)'
        }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Board */}
                <rect x="0" y="0" width={size} height={size} fill="none" stroke="var(--color-border)" strokeWidth="2" />

                {houses.map((house, i) => (
                    <g key={i}>
                        <path
                            d={housePaths[i]}
                            fill="none"
                            stroke="var(--color-border)"
                            strokeWidth="1.5"
                        />
                        {/* Rashi Number */}
                        <text
                            x={housePositions[i].r.x}
                            y={housePositions[i].r.y}
                            textAnchor="middle"
                            fontSize="14"
                            fontWeight="bold"
                            fill="var(--color-accent-primary)"
                        >
                            {house.rashi + 1}
                        </text>

                        {/* Planets */}
                        <g>
                            {house.planets.map((planet, pIdx) => (
                                <text
                                    key={pIdx}
                                    x={housePositions[i].p.x}
                                    y={housePositions[i].p.y + (pIdx * 14) - ((house.planets.length - 1) * 7)}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="900"
                                    fill={getPlanetColor(planet)}
                                >
                                    {planetAbbr[planet.toLowerCase()] || planet.substring(0, 2)}
                                </text>
                            ))}
                        </g>
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default KundaliChart;
