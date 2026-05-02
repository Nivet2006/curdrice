import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const width = 800; 
const height = 400; 
const chartCallback = (ChartJS: any) => {
    ChartJS.defaults.font.family = 'Helvetica';
    ChartJS.defaults.font.size = 14;
    ChartJS.defaults.color = '#1B2A6B';
};

const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });

export async function generateChartBuffer(type: 'bar' | 'pie', label: string, data: any[]) {
    const configuration = {
        type: type,
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                label: label,
                data: data.map(d => d.value),
                backgroundColor: [
                    '#1B2A6B', // Navy
                    '#4A90D9', // Sky Blue
                    '#F5C842', // Soft Gold
                    '#E0E0E0', // Light Gray
                    '#2D9E5F', // Green
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: label,
                    font: { size: 18, weight: 'bold' }
                },
                legend: {
                    display: type === 'pie'
                }
            },
            scales: type === 'bar' ? {
                y: { beginAtZero: true }
            } : undefined
        }
    };

    return await chartJSNodeCanvas.renderToBuffer(configuration as any);
}
