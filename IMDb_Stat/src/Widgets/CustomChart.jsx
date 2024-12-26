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
import regression from 'regression';

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

  const sortedData = data.sort((a, b) => a.numVotes - b.numVotes);

const regressionData = data.map(item => [item.numVotes, item.averageRating]);
const result = regression.linear(regressionData);
const lineData = result.points.map(point => ({
  numVotes: point[0],
  averageRating: point[1]
}));

  console.log("Line Data:", lineData);
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
          <ScatterChart>
            <CartesianGrid />
            <XAxis dataKey="numVotes" name="Number of Votes" />
            <YAxis dataKey="averageRating" name="Average Rating" domain={[0, 10]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Correlation" data={sortedData} fill="#8884d8" />
            <Line type="monotone" data={lineData} dataKey="averageRating" stroke="#ff7300" strokeWidth={5} />
          </ScatterChart>
        )}
      </ResponsiveContainer>
      
    </div>
  );
};

export default CustomChart;