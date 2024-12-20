import React from 'react';
import {
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  Line,
  Bar,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Scatter
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    const isPieChart = payload[0].payload && payload[0].payload.status !== undefined;

    if (isPieChart) {
      const { status, percentage } = payload[0].payload;
      return (
        <div style={{ backgroundColor: '#333', border: '1px solid #ccc', padding: '5px', fontSize: '12px', color: '#fff' }}>
          <p>{`${status} : ${percentage.toFixed(2)}%`}</p>
        </div>
      );
    }

    const value = payload[0].value;
    return (
      <div style={{ backgroundColor: '#333', border: '1px solid #ccc', padding: '5px', fontSize: '12px', color: '#fff' }}>
        <p>{`${label} : ${value}`}</p>
      </div>
    );
  }
  return null;
};

const CustomChart = ({ data, dataKey, xAxisKey, title, chartType, customFrontSize = 10, customInterval = 0 }) => {
  if (!data || data.length === 0) {
    return <p>No data available</p>;
  }

  console.log(data)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ marginBottom: '5px' }}>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'line' && (
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey={dataKey} stroke="#8884d8" />
          </LineChart>
        )}
        {chartType === 'bar' && (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} angle={-45} textAnchor="end" fontSize={customFrontSize} interval={customInterval}/>
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={dataKey} fill="#8884d8" />
          </BarChart>
        )}
        {chartType === 'pie' && (
          <PieChart>
          <Pie 
            data={data} 
            dataKey="percentage" 
            nameKey="status"
            cx="50%" 
            cy="50%" 
            outerRadius={50} 
            fill="#8884d8" 
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} 
            stroke="#fff"
            strokeWidth={2} 
            activeShape={null}
          />
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
        )}
        {chartType === 'scatter' && ( 
           <ScatterChart width={600} height={400}>
           <CartesianGrid />
           <XAxis dataKey="numVotes" domain={[0, 'dataMax']} />
           <YAxis domain={[0, 10]} />
           <Tooltip />
           <Scatter data={data} fill="#8384d0" />
         </ScatterChart>
        )}
      </ResponsiveContainer>
      
    </div>
  );
};

export default CustomChart;