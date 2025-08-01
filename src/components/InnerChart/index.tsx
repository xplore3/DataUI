import React from "react";
import {
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    AreaChart, Area,
    ComposedChart,
    XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    LabelList
} from 'recharts';


interface ChartProps {
    type: 'bar' | 'line' | 'pie' | 'radar' | 'area' | 'funnel' | 'pyramid';
    title: string;
    xKey: string;
    yKey: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
}


const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a28dd0', '#ffbb28'];


const InnerChart: React.FC<ChartProps> = ({type, title, xKey, yKey, data}) => {
    // console.log(typeof(data));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chartData: any[] = data;
    
    // try {
    //     chartData = JSON.parse(data);
    //     console.log('chartData', chartData);
    // } catch (e) {
    //     console.log('data', data);
    //     return <div>数据解析失败</div>
    // }

    if (!Array.isArray(chartData) || !xKey || !yKey) return null;

    const renderChart = () => {
        switch (type) {
            case 'bar':
                return (
                    <BarChart data={chartData}>
                        <XAxis dataKey={xKey} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey={yKey} fill={COLORS[0]} />
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart data={chartData}>
                        <XAxis dataKey={xKey} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey={yKey} stroke={COLORS[1]} />
                    </LineChart>
                );

            case 'area':
                return (
                    <AreaChart data={chartData}>
                        <XAxis dataKey={xKey} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type={"monotone"} dataKey={yKey} stroke={COLORS[2]} fill={COLORS[2]} />
                    </AreaChart>
                );

            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey={yKey}
                            nameKey={xKey}
                            cx={"50%"}
                            cy={"50%"}
                            outerRadius={80}
                            label
                        >
                            {chartData.map((_, i) => (
                                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                );

            case 'radar':
                return (
                    <RadarChart data={chartData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey={xKey} />
                        <PolarRadiusAxis />
                        <Radar 
                            name={yKey}
                            dataKey={yKey}
                            stroke={COLORS[3]}
                            fill={COLORS[3]}
                            fillOpacity={0.6}
                        />
                        <Legend />
                        <Tooltip />
                    </RadarChart>
                );

            case 'funnel':
                return (
                    <ComposedChart
                        layout="vertical"
                        data={[...chartData].sort((a, b) => b[yKey] - a[yKey])}
                        margin={{ top: 20, right: 20, bottom: 20, left: 80 }}
                    >
                        <XAxis type="number" />
                        <YAxis dataKey={xKey} type="category" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey={yKey} fill={COLORS[4]} barSize={50} />
                    </ComposedChart>
                );

            case 'pyramid': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sortedData: any[] = [...chartData].sort((a, b) => a[yKey] - b[yKey]);

                return (
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{top: 20, right: 30, left: 50, bottom: 20}}
                    >
                        <XAxis type="number" hide />
                        <YAxis 
                            type="category"
                            dataKey={xKey}
                            width={120}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar
                            dataKey={yKey}
                            fill="#8884d8"
                            barSize={40}
                            radius={[10, 10, 10, 10]}
                        >
                            {sortedData.map((_, index) => (
                                <Cell 
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}

                            <LabelList dataKey={yKey} position="right" />
                        </Bar>
                    </BarChart>
                )
            }
        }
    };

    return (
        <div style={{width: '100%', margin: 'irem 0'}}>
            {title && (
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {title}
                </h3>
            )}

            <div style={{ width: '100%', height: 300 }} >
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    )
};


export default InnerChart;