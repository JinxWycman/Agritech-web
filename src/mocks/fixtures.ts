import { SYMPTOM_CATALOGUE } from "@/lib/symptoms";
import type { AdminSummary, Expert, ExpertQueueSummary, FarmerDashboardSummary, FarmConditionsSnapshot, FarmerProfile } from "@/types/domain";

export const demoFarmerSummary: FarmerDashboardSummary = {
  farmer: {
    id: "demo-farmer-1",
    name: "Demo Farmer",
    phone: "0712 345 678",
    county: "Sample County",
    active: true,
  },
};

export const demoExpertQueue: ExpertQueueSummary = {
  pending: [{ id: "DEMO-REQ-1", status: "Pending", issueType: "Sample crop question", farmerName: "Demo Farmer" }],
  accepted: [],
  completed: 0,
};

export const demoExperts: Expert[] = [
  {
    id: "demo-expert-1", name: "Demo Expert Amina", phone: "0700 000 001",
    expertType: "Sample crop expert", county: "Sample County", organization: "Agritech demo",
    available: true, workload: 2, lastAssignedAt: null, responseRate: 0.92, location: { latitude: -1.29, longitude: 36.82 },
  },
  {
    id: "demo-expert-2", name: "Demo Expert Kamau", phone: "0700 000 002",
    expertType: "Sample livestock expert", county: "Sample County", organization: "Agritech demo",
    available: true, workload: 1, lastAssignedAt: null, responseRate: 0.86, location: { latitude: -0.3, longitude: 37.8 },
  },
  {
    id: "demo-expert-3", name: "Demo Expert Wanjiku", phone: "0700 000 003",
    expertType: "Sample agriculture expert", county: "Sample County", organization: "Agritech demo",
    available: true, workload: 3, lastAssignedAt: null, responseRate: 0.95, location: { latitude: -0.53, longitude: 37.45 },
  },
];

export const demoSymptoms = SYMPTOM_CATALOGUE;

export const demoFarmConditions: FarmConditionsSnapshot = {
  latitude: -1.29,
  longitude: 36.82,
  currentWeather: "partlyCloudy",
  todayHighC: 24,
  todayLowC: 15,
  forecast: [
    { day: "day1", condition: "partlyCloudy", highC: 24, lowC: 15 },
    { day: "day2", condition: "lightRain", highC: 23, lowC: 15 },
    { day: "day3", condition: "cloudy", highC: 22, lowC: 14 },
    { day: "day4", condition: "sunnyIntervals", highC: 24, lowC: 14 },
    { day: "day5", condition: "lightRain", highC: 22, lowC: 15 },
    { day: "day6", condition: "partlyCloudy", highC: 23, lowC: 14 },
    { day: "day7", condition: "cloudy", highC: 22, lowC: 14 },
  ],
  ndvi: 0.68,
  ndviNormal: 0.60,
  rainfallMm: 72,
  rainfallNormalMm: 55,
  rainfallTrend: "above",
  ndviTrend: "above",
};

export const demoFarmerProfile: Omit<FarmerProfile, "profile_complete"> = {
  farmSizeAcres: null,
  crops: [],
  livestock: [],
  subCounty: "",
  ward: "",
  latitude: null,
  longitude: null,
  county: "",
};

export const demoFarmerCounts = {
  openExpertRequests: 1,
  unreadAlerts: 2,
};

export const demoDefaultFarmLocation = { latitude: -1.29, longitude: 36.82 };

export const demoAdminSummary: AdminSummary = {
  farmersTotal: 128,
  farmersLast7Days: 9,
  activePaidSubscriptions: 42,
  failedPaymentsLast7Days: 2,
  requestsByStatus: { Pending: 4, Offered: 2, Accepted: 7, Completed: 15 },
  requestsAging48Hours: 1,
  advisoriesActive: 6,
  smsSessionsOpen: 3,
};
