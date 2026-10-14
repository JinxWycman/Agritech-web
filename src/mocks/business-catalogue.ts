import type { AgroZone, CropVariety, LivestockBreed, LocalizedText, OpeningHours, Vendor, VendorProduct } from "@/types/business";

const text = (en: string, sw: string): LocalizedText => ({ en, sw });
const hours: OpeningHours = {
  0: null,
  1: { open: "08:00", close: "17:00" },
  2: { open: "08:00", close: "17:00" },
  3: { open: "08:00", close: "17:00" },
  4: { open: "08:00", close: "17:00" },
  5: { open: "08:00", close: "17:00" },
  6: { open: "09:00", close: "14:00" },
};
const crop = (
  id: string,
  name: LocalizedText,
  altitudeM: { min: number; max: number },
  annualRainfallMm: { min: number; max: number },
  maturityDays: number,
): CropVariety => ({
  id, name, suitability: { altitudeM, annualRainfallMm }, maturityDays,
  risks: [text("Sample risk: confirm local pest pressure before planting.", "Hatari ya mfano: thibitisha wadudu wa eneo kabla ya kupanda.")],
  plantingWindow: text("Sample window: confirm with local seasonal forecasts.", "Kipindi cha mfano: thibitisha kwa utabiri wa misimu wa eneo."),
  spacing: text("Sample spacing: confirm with a qualified agronomist.", "Nafasi ya mfano: thibitisha na mtaalamu wa kilimo."),
  intercroppingTips: [text("Sample tip: consider a locally suitable intercrop.", "Dokezo la mfano: fikiria zao mseto linalofaa eneo.")],
  rotationTips: [text("Sample tip: rotate crops where suitable.", "Dokezo la mfano: badilisha mazao panapofaa.")],
});

export const demoAgroZones: AgroZone[] = [
  { id: "highland", name: text("Highland", "Nyanda za juu"), centre: { latitude: -0.3, longitude: 36.08 }, altitudeM: 1900, annualRainfallMm: 1100 },
  { id: "midland", name: text("Midland", "Nyanda za kati"), centre: { latitude: -1.0, longitude: 37.1 }, altitudeM: 1200, annualRainfallMm: 850 },
  { id: "semi-arid-lowland", name: text("Semi-arid lowland", "Nyanda kame za chini"), centre: { latitude: -1.5, longitude: 38.0 }, altitudeM: 800, annualRainfallMm: 450 },
  { id: "coastal", name: text("Coastal", "Pwani"), centre: { latitude: -3.2, longitude: 40.1 }, altitudeM: 100, annualRainfallMm: 900 },
];

export const demoCropVarieties: CropVariety[] = [
  crop("maize-highland-sample", text("Highland maize (sample)", "Mahindi ya nyanda za juu (mfano)"), { min: 1300, max: 2400 }, { min: 800, max: 1500 }, 150),
  crop("maize-midland-sample", text("Midland maize (sample)", "Mahindi ya nyanda za kati (mfano)"), { min: 0, max: 2200 }, { min: 300, max: 1200 }, 120),
  crop("beans-midland-sample", text("Midland bean (sample)", "Maharagwe ya nyanda za kati (mfano)"), { min: 0, max: 2400 }, { min: 300, max: 1400 }, 95),
  crop("potato-highland-sample", text("Highland potato (sample)", "Viazi vya nyanda za juu (mfano)"), { min: 0, max: 2800 }, { min: 300, max: 1800 }, 110),
  crop("sorghum-dryland-sample", text("Dryland sorghum (sample)", "Mtama wa maeneo makavu (mfano)"), { min: 0, max: 2400 }, { min: 250, max: 1500 }, 105),
  crop("cassava-coastal-sample", text("Coastal cassava (sample)", "Muhogo wa pwani (mfano)"), { min: 0, max: 2400 }, { min: 300, max: 1600 }, 240),
];

const breed = (
  id: string,
  name: LocalizedText,
  altitudeM: { min: number; max: number },
  annualRainfallMm: { min: number; max: number },
  maturityMonths: number,
): LivestockBreed => ({
  id, name, suitability: { altitudeM, annualRainfallMm }, maturityMonths,
  risks: [text("Sample risk: consult a veterinary professional about local disease risks.", "Hatari ya mfano: wasiliana na daktari wa mifugo kuhusu magonjwa ya eneo.")],
  plantingWindow: text("Not seasonal; confirm local breeding and animal-health plans.", "Si ya msimu; thibitisha mipango ya uzalishaji na afya ya mifugo ya eneo."),
  stockingDensity: text("Sample density: confirm carrying capacity with an extension officer.", "Msongamano wa mfano: thibitisha uwezo wa malisho na afisa ugani."),
  feedPlan: [text("Sample feed plan: confirm locally available balanced feed.", "Mpango wa chakula wa mfano: thibitisha chakula bora kinachopatikana eneo.")],
  housing: [text("Sample housing note: provide suitable shelter and ventilation.", "Dokezo la banda la mfano: toa makazi na hewa ya kutosha.")],
  vaccinationCalendar: [text("Sample calendar: ask a veterinary professional for the local schedule.", "Ratiba ya mfano: uliza mtaalamu wa mifugo kuhusu ratiba ya eneo.")],
});

export const demoLivestockBreeds: LivestockBreed[] = [
  breed("dairy-cattle-highland-sample", text("Dairy cattle (highland sample)", "Ng'ombe wa maziwa (mfano wa nyanda za juu)"), { min: 0, max: 2800 }, { min: 500, max: 1800 }, 24),
  breed("dairy-cattle-midland-sample", text("Dairy cattle (midland sample)", "Ng'ombe wa maziwa (mfano wa nyanda za kati)"), { min: 0, max: 2400 }, { min: 400, max: 1600 }, 24),
  breed("meat-goat-dryland-sample", text("Meat goat (dryland sample)", "Mbuzi wa nyama (mfano wa maeneo makavu)"), { min: 0, max: 2000 }, { min: 100, max: 1600 }, 12),
  breed("dual-purpose-chicken-sample", text("Dual-purpose chicken (sample)", "Kuku wa matumizi mawili (mfano)"), { min: 0, max: 2400 }, { min: 300, max: 1800 }, 6),
  breed("coastal-sheep-sample", text("Coastal sheep (sample)", "Kondoo wa pwani (mfano)"), { min: 0, max: 2400 }, { min: 300, max: 1800 }, 12),
];

const vendor = (
  id: string, en: string, sw: string, county: string, latitude: number, longitude: number,
  phone: string, categories: string[], certified: boolean, rating: number,
): Vendor => ({
  id, name: text(en, sw), county, location: { latitude, longitude }, phone, whatsapp: phone,
  openingHours: hours, rating, certified, categories,
});

export const demoVendors: Vendor[] = [
  vendor("kiambu-agro-sample", "Kiambu Farm Inputs (sample)", "Pembejeo za Shamba Kiambu (mfano)", "Kiambu", -1.17, 36.83, "0700000101", ["seeds", "fertiliser", "tools"], true, 4.2),
  vendor("nakuru-agro-sample", "Nakuru Growers (sample)", "Wakulima Nakuru (mfano)", "Nakuru", -0.30, 36.08, "0700000102", ["seeds", "feed", "tools"], true, 4.0),
  vendor("makueni-agro-sample", "Makueni Dryland Supplies (sample)", "Pembejeo za maeneo makavu Makueni (mfano)", "Makueni", -2.25, 37.90, "0700000103", ["seeds", "feed", "fertiliser"], false, 3.9),
  vendor("kilifi-agro-sample", "Kilifi Coast Agrovet (sample)", "Duka la pembejeo Kilifi (mfano)", "Kilifi", -3.22, 40.12, "0700000104", ["feed", "vaccines", "tools"], true, 4.5),
  vendor("machakos-agro-sample", "Machakos Farm Store (sample)", "Duka la shamba Machakos (mfano)", "Machakos", -1.52, 37.27, "0700000105", ["seeds", "fertiliser", "vaccines"], false, 3.8),
  vendor("kisumu-agro-sample", "Kisumu Farmers Shop (sample)", "Duka la wakulima Kisumu (mfano)", "Kisumu", -0.10, 34.75, "0700000106", ["feed", "seeds", "tools"], true, 4.1),
  vendor("meru-agro-sample", "Meru Agri Centre (sample)", "Kituo cha kilimo Meru (mfano)", "Meru", 0.05, 37.65, "0700000107", ["fertiliser", "feed", "vaccines"], true, 4.3),
  vendor("kitui-agro-sample", "Kitui Livestock & Crop Supplies (sample)", "Pembejeo za mazao na mifugo Kitui (mfano)", "Kitui", -1.37, 38.01, "0700000108", ["seeds", "feed", "vaccines"], false, 3.7),
];

export const demoVendorProducts: VendorProduct[] = [
  { id: "seed-maize-kiambu", vendorId: "kiambu-agro-sample", name: text("Sample maize seed pack", "Pakiti ya mbegu za mahindi (mfano)"), category: "seeds", priceKES: 650, unit: text("2 kg pack", "Pakiti ya kilo 2"), stockStatus: "in_stock" },
  { id: "fertiliser-kiambu", vendorId: "kiambu-agro-sample", name: text("Sample farm fertiliser", "Mbolea ya shamba (mfano)"), category: "fertiliser", priceKES: 3200, unit: text("50 kg bag", "Gunia la kilo 50"), stockStatus: "low_stock" },
  { id: "tools-kiambu", vendorId: "kiambu-agro-sample", name: text("Sample hand tool", "Chombo cha mkono (mfano)"), category: "tools", priceKES: 450, unit: text("each", "kila moja"), stockStatus: "in_stock" },
  { id: "seed-bean-nakuru", vendorId: "nakuru-agro-sample", name: text("Sample bean seed", "Mbegu za maharagwe (mfano)"), category: "seeds", priceKES: 480, unit: text("1 kg pack", "Pakiti ya kilo 1"), stockStatus: "in_stock" },
  { id: "feed-nakuru", vendorId: "nakuru-agro-sample", name: text("Sample dairy feed", "Chakula cha ng'ombe wa maziwa (mfano)"), category: "feed", priceKES: 2100, unit: text("50 kg bag", "Gunia la kilo 50"), stockStatus: "low_stock" },
  { id: "seed-sorghum-makueni", vendorId: "makueni-agro-sample", name: text("Sample dryland seed", "Mbegu za maeneo makavu (mfano)"), category: "seeds", priceKES: 390, unit: text("1 kg pack", "Pakiti ya kilo 1"), stockStatus: "in_stock" },
  { id: "feed-goat-kilifi", vendorId: "kilifi-agro-sample", name: text("Sample goat feed", "Chakula cha mbuzi (mfano)"), category: "feed", priceKES: 1800, unit: text("25 kg bag", "Gunia la kilo 25"), stockStatus: "in_stock" },
  { id: "vaccine-kilifi", vendorId: "kilifi-agro-sample", name: text("Sample poultry vaccine", "Chanjo ya kuku (mfano)"), category: "vaccines", priceKES: 900, unit: text("dose", "dozi"), stockStatus: "low_stock" },
  { id: "fertiliser-machakos", vendorId: "machakos-agro-sample", name: text("Sample crop fertiliser", "Mbolea ya mazao (mfano)"), category: "fertiliser", priceKES: 2900, unit: text("50 kg bag", "Gunia la kilo 50"), stockStatus: "in_stock" },
  { id: "seed-kisumu", vendorId: "kisumu-agro-sample", name: text("Sample maize seed", "Mbegu za mahindi (mfano)"), category: "seeds", priceKES: 620, unit: text("2 kg pack", "Pakiti ya kilo 2"), stockStatus: "out_of_stock" },
  { id: "feed-meru", vendorId: "meru-agro-sample", name: text("Sample poultry feed", "Chakula cha kuku (mfano)"), category: "feed", priceKES: 1600, unit: text("25 kg bag", "Gunia la kilo 25"), stockStatus: "in_stock" },
  { id: "vaccine-kitui", vendorId: "kitui-agro-sample", name: text("Sample livestock vaccine", "Chanjo ya mifugo (mfano)"), category: "vaccines", priceKES: 750, unit: text("dose", "dozi"), stockStatus: "in_stock" },
];
