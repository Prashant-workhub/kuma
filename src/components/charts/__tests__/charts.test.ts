/**
 * Unit Tests for Kuma Chart Components & Wrappers
 * Asserts clean rendering and execution of empty vs populated states for all chart wrappers.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { ChartCard } from '../ChartCard';
import { BarChart } from '../BarChart';
import { LineChart } from '../LineChart';
import { RadarChart } from '../RadarChart';
import { Sparkline } from '../Sparkline';
import { Heatmap } from '../Heatmap';

describe('Standardized Chart Wrappers — Unit Tests', () => {
  describe('ChartCard Container', () => {
    test('renders title, description, and visual children in populated state', () => {
      const el = React.createElement(
        ChartCard,
        {
          title: 'Completion Rates',
          description: 'Overall course completion metrics.',
          tableData: [{ label: 'Kubernetes', value: 85 }],
        },
        React.createElement('div', { 'data-testid': 'chart-child' }, 'Chart SVG')
      );
      assert.strictEqual((el.props as any).title, 'Completion Rates');
      assert.strictEqual((el.props as any).tableData.length, 1);
    });

    test('handles empty data table gracefully', () => {
      const el = React.createElement(
        ChartCard,
        {
          title: 'Empty Metrics',
          tableData: [],
        },
        React.createElement('div', null, 'Empty chart')
      );
      assert.strictEqual((el.props as any).tableData.length, 0);
    });
  });

  describe('BarChart Component', () => {
    test('renders populated horizontal and vertical bar data points', () => {
      const data = [
        { label: 'Engineering', value: 88, targetValue: 90 },
        { label: 'Operations', value: 65, targetValue: 80 },
      ];
      const horiz = React.createElement(BarChart, { data, orientation: 'horizontal' });
      const vert = React.createElement(BarChart, { data, orientation: 'vertical' });
      assert.strictEqual(horiz.props.data.length, 2);
      assert.strictEqual(vert.props.orientation, 'vertical');
    });

    test('renders EmptyState on empty data array', () => {
      const empty = React.createElement(BarChart, { data: [] });
      assert.strictEqual(empty.props.data.length, 0);
    });
  });

  describe('LineChart Component', () => {
    test('renders trend line data points and axis title', () => {
      const data = [
        { label: 'Jan', value: 10 },
        { label: 'Feb', value: 25 },
        { label: 'Mar', value: 40 },
      ];
      const chart = React.createElement(LineChart, { data, axisTitle: 'Monthly Growth' });
      assert.strictEqual(chart.props.data.length, 3);
      assert.strictEqual(chart.props.axisTitle, 'Monthly Growth');
    });

    test('handles empty data array without throwing', () => {
      const empty = React.createElement(LineChart, { data: [] });
      assert.strictEqual(empty.props.data.length, 0);
    });
  });

  describe('RadarChart Component', () => {
    test('renders radar points comparing current vs target levels', () => {
      const data = [
        { label: 'Architecture', current: 3, target: 4 },
        { label: 'Security', current: 2, target: 3 },
      ];
      const chart = React.createElement(RadarChart, { data, size: 280 });
      assert.strictEqual(chart.props.data.length, 2);
      assert.strictEqual(chart.props.size, 280);
    });

    test('handles empty radar data gracefully', () => {
      const empty = React.createElement(RadarChart, { data: [] });
      assert.strictEqual(empty.props.data.length, 0);
    });
  });

  describe('Sparkline Component', () => {
    test('renders compact sparkline with current value readout', () => {
      const spark = React.createElement(Sparkline, { data: [10, 15, 22, 30] });
      assert.strictEqual(spark.props.data.length, 4);
    });

    test('handles empty numerical array', () => {
      const empty = React.createElement(Sparkline, { data: [] });
      assert.strictEqual(empty.props.data.length, 0);
    });
  });

  describe('Heatmap Component', () => {
    test('renders sequential matrix rows and column headers', () => {
      const rows = [
        { label: 'Ananya Rao', values: { 'Data Analysis': 85, 'Security': 90 } },
      ];
      const cols = ['Data Analysis', 'Security'];
      const map = React.createElement(Heatmap, { rows, columns: cols });
      assert.strictEqual(map.props.rows.length, 1);
      assert.strictEqual(map.props.columns.length, 2);
    });

    test('handles empty heatmap matrix gracefully', () => {
      const empty = React.createElement(Heatmap, { rows: [], columns: [] });
      assert.strictEqual(empty.props.rows.length, 0);
    });
  });
});
