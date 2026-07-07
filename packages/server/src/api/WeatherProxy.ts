/**
 * @file WeatherProxy.ts
 * @description 기상청/해양조사원 공공 API를 백엔드에서 중계(CORS 우회 및 API 키 암호화 보호)하는 API 라우터
 */

import { Router } from 'express';
import { WeatherApiClient, OceanApiClient } from '@tra/core';

export const weatherProxyRouter: Router = Router();

const weatherClient = new WeatherApiClient(process.env.KMA_API_KEY);
const oceanClient = new OceanApiClient(process.env.KHOA_API_KEY);

weatherProxyRouter.get('/weather', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 34.7832;
    const lon = parseFloat(req.query.lon as string) || 128.6834;

    const weather = await weatherClient.fetchCurrentWeather(lat, lon);
    res.json(weather);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch weather data', details: msg });
  }
});

weatherProxyRouter.get('/tide', async (req, res) => {
  try {
    const stationCode = (req.query.station as string) || '1030'; // 거제 기본
    const tide = await oceanClient.fetchTideInfo(stationCode);
    res.json(tide);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to fetch tide data', details: msg });
  }
});
