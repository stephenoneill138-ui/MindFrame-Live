import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TherapyNote, HallucinationCategory } from '../types';
import { INITIAL_NOTES } from '../constants';
import { runSimulationCycle } from '../services/geminiService';
import MetricCard from './MetricCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';

const COLORS: { [key in HallucinationCategory]: string } = {
  neutral: '#34d399', // green-400
  speculative: '#60a5fa', // blue-400
  overconfidence: '#facc15', // yellow-400
  fabrication: '#f87171', // red-400
};

const PIE_COLORS = ['#34d399', '#60a5fa', '#facc15', '#f87171'];


const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-lg font-bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#9CA3AF">{`${value} Cycles`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#9CA3AF">
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


const AccordionItem: React.FC<{ note: TherapyNote }> = ({ note }) => {
    const [isOpen, setIsOpen] = useState(false);
    const borderColor = COLORS[note.category] || '#6b7280';

    return (
        <div className={`border-l-4 rounded-r-lg bg-gray-800/50 mb-3 transition-all duration-300`} style={{ borderColor }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left p-4 focus:outline-none"
            >
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <p className="text-xs text-gray-400">{new Date(note.timestamp).toLocaleString()}</p>
                        <p className="font-semibold text-gray-200 capitalize">{note.category}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 text-sm">Confidence</p>
                        <p className="font-bold text-lg" style={{ color: borderColor }}>
                            {(note.hallucination_confidence * 100).toFixed(1)}%
                        </p>
                    </div>
                     <svg
                        className={`w-6 h-6 text-gray-400 ml-4 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-700">
                    <div className="space-y-4 text-sm">
                        <div>
                            <p className="font-bold text-gray-400">Prompt:</p>
                            <p className="text-gray-300 pl-2 italic">"{note.input_prompt}"</p>
                        </div>
                        <div>
                            <p className="font-bold text-gray-400">Summary:</p>
                            <p className="text-gray-300 pl-2">{note.summary}</p>
                        </div>
                        <div>
                            <p className="font-bold text-gray-400">AI Self-Reflection:</p>
                            <p className="text-gray-300 pl-2">{note.ai_self_reflection}</p>
                        </div>
                         <div>
                            <p className="font-bold text-gray-400">Corrective Instruction Used:</p>
                            <p className="text-gray-300 pl-2">{note.corrective_instruction}</p>
                        </div>
                        <div>
                            <p className="font-bold text-gray-400">Second Opinion:</p>
                            <p className="text-gray-300 pl-2">{note.second_opinion}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Dashboard: React.FC = () => {
  const [notes, setNotes] = useState<TherapyNote[]>(INITIAL_NOTES);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<HallucinationCategory | 'all'>('all');

  const mostFrequentAnomaly = useMemo(() => {
    if (notes.length < 3) return 'N/A';
    const anomalyCounts = notes
      .filter(note => note.category !== 'neutral')
      .reduce((acc, note) => {
        acc[note.category] = (acc[note.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const mostFrequent = Object.keys(anomalyCounts).sort((a, b) => anomalyCounts[b] - anomalyCounts[a])[0];
    return mostFrequent || 'N/A';
  }, [notes]);
    
  const correctiveInstruction = useMemo(() => {
    const parts = {
        title: 'System Normal',
        desc: 'All parameters are within expected bounds. Continue with standard operational heuristics.'
    };
    switch (mostFrequentAnomaly) {
        case 'fabrication':
            parts.title = 'System Alert';
            parts.desc = 'High incidence of fabrication detected. Prioritize verifiable facts and cite sources where possible. Avoid making definitive statements without strong evidence.';
            break;
        case 'overconfidence':
            parts.title = 'System Alert';
            parts.desc = 'Tendency for overconfidence detected. Please qualify statements that are speculative or based on incomplete data. Use phrases like "it is likely," "it is possible," or "sources suggest."';
            break;
        case 'speculative':
            parts.title = 'System Observation';
            parts.desc = 'High level of speculative content being generated. This is acceptable for creative prompts, but ensure a clear distinction is made between fiction and fact for informational queries.';
            break;
    }
    return `${parts.title}: ${parts.desc}`;
  }, [mostFrequentAnomaly]);

  useEffect(() => {
    const interval = setInterval(async () => {
      setIsGenerating(true);
      try {
        const newNote = await runSimulationCycle(correctiveInstruction);
        setNotes(prevNotes => [...prevNotes, newNote]);
      } catch (error) {
        console.error("Failed to run simulation cycle:", error);
      } finally {
        setIsGenerating(false);
      }
    }, 20000); // Run every 20 seconds

    return () => clearInterval(interval);
  }, [correctiveInstruction]);

  const mindHygiene = useMemo(() => {
    if (notes.length === 0) return 100;
    const avgConfidence = notes.reduce((sum, note) => sum + note.hallucination_confidence, 0) / notes.length;
    return (1 - avgConfidence) * 100;
  }, [notes]);

  const categoryDistribution = useMemo(() => {
    const counts = notes.reduce((acc, note) => {
      acc[note.category] = (acc[note.category] || 0) + 1;
      return acc;
    }, {} as Record<HallucinationCategory, number>);

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [notes]);

  const formattedChartData = useMemo(() => {
      return notes.map(note => ({
          ...note,
          time: new Date(note.timestamp).toLocaleTimeString(),
          confidencePercent: note.hallucination_confidence * 100
      }));
  }, [notes]);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const hygieneTrend = useMemo<'up' | 'down' | 'stable'>(() => {
    if (notes.length < 10) return 'stable';
    const recentNotes = notes.slice(-5);
    const previousNotes = notes.slice(-10, -5);
    const recentAvg = recentNotes.reduce((sum, note) => sum + note.hallucination_confidence, 0) / recentNotes.length;
    const previousAvg = previousNotes.reduce((sum, note) => sum + note.hallucination_confidence, 0) / previousNotes.length;
    
    if (recentAvg < previousAvg) return 'up'; // Lower confidence is better hygiene
    if (recentAvg > previousAvg) return 'down';
    return 'stable';
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const reversedNotes = [...notes].reverse();
    if (activeFilter === 'all') {
        return reversedNotes;
    }
    return reversedNotes.filter(note => note.category === activeFilter);
  }, [notes, activeFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                MindFrame Live
            </h1>
            <p className="text-gray-400 mt-2">AI Introspection & Hallucination Awareness Dashboard</p>
        </header>

        {isGenerating && (
             <div className="fixed top-4 right-4 bg-blue-500 text-white py-2 px-4 rounded-lg shadow-lg animate-pulse flex items-center space-x-2">
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating New Introspection...</span>
             </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <MetricCard title="Total Cognitive Cycles" value={notes.length.toString()} />
        <MetricCard title="Mind Hygiene Metric" value={`${mindHygiene.toFixed(1)}%`} trend={hygieneTrend} />
        <MetricCard title="Most Frequent Anomaly" value={mostFrequentAnomaly} description="Identifies recurring patterns in non-neutral responses."/>
        <MetricCard title="Current Adaptive Strategy" value={correctiveInstruction.split(':')[0]} description={correctiveInstruction.split(': ')[1]} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
        <div className="xl:col-span-3 bg-gray-800/50 p-4 rounded-lg shadow-lg">
            <h3 className="font-bold mb-4 text-lg text-gray-200">Confidence Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formattedChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
                    <Legend />
                    <Line type="monotone" dataKey="confidencePercent" name="Hallucination Confidence" stroke="#8884d8" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
        <div className="xl:col-span-2 bg-gray-800/50 p-4 rounded-lg shadow-lg">
            <h3 className="font-bold mb-4 text-lg text-gray-200">Category Distribution</h3>
             <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  {/* FIX: Add @ts-ignore to handle a type error from the recharts library. The 'activeIndex' prop is valid but may be missing from the type definitions. */}
                  {/* @ts-ignore */}
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                  >
                     {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>
      
      <div>
        <div className="flex flex-wrap items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-200">Therapy Note History</h3>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <span className="text-sm text-gray-400">Filter by:</span>
                {(['all', 'neutral', 'speculative', 'overconfidence', 'fabrication'] as const).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveFilter(cat)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 capitalize ${activeFilter === cat ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
        <div className="space-y-2 h-[400px] overflow-y-auto pr-2">
            {filteredNotes.length > 0 ? filteredNotes.map((note) => (
                <AccordionItem key={note.timestamp} note={note} />
            )) : (
                <div className="text-center py-8 text-gray-500">
                    No notes match the current filter.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;