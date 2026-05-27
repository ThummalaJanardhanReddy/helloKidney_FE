export interface IPatient {
  address: null;
  age: number | null;
  city: string | null;
  created_on: string;
  district: string | null;
  email_id: string | null;
  full_name: string;
  gender: string;
  locality: string | null;
  mobile_no: string;
  patient_id: number;
  patient_uniqueid: string | null;
  pincode: string | null;
  state: string | null;
  user_name: string | null;
}

export interface Country {
  name: string;
  dial_code: string;
  code: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: "Afghanistan", dial_code: "+93", code: "AF", flag: "🇦🇫" },
  { name: "Albania", dial_code: "+355", code: "AL", flag: "🇦🇱" },
  { name: "Algeria", dial_code: "+213", code: "DZ", flag: "🇩🇿" },
  { name: "Argentina", dial_code: "+54", code: "AR", flag: "🇦🇷" },
  { name: "Australia", dial_code: "+61", code: "AU", flag: "🇦🇺" },
  { name: "Austria", dial_code: "+43", code: "AT", flag: "🇦🇹" },
  { name: "Bangladesh", dial_code: "+880", code: "BD", flag: "🇧🇩" },
  { name: "Belgium", dial_code: "+32", code: "BE", flag: "🇧🇪" },
  { name: "Bhutan", dial_code: "+975", code: "BT", flag: "🇧🇹" },
  { name: "Brazil", dial_code: "+55", code: "BR", flag: "🇧🇷" },
  { name: "Canada", dial_code: "+1", code: "CA", flag: "🇨🇦" },
  { name: "China", dial_code: "+86", code: "CN", flag: "🇨🇳" },
  { name: "Colombia", dial_code: "+57", code: "CO", flag: "🇨🇴" },
  { name: "Croatia", dial_code: "+385", code: "HR", flag: "🇭🇷" },
  { name: "Czech Republic", dial_code: "+420", code: "CZ", flag: "🇨🇿" },
  { name: "Denmark", dial_code: "+45", code: "DK", flag: "🇩🇰" },
  { name: "Egypt", dial_code: "+20", code: "EG", flag: "🇪🇬" },
  { name: "Finland", dial_code: "+358", code: "FI", flag: "🇫🇮" },
  { name: "France", dial_code: "+33", code: "FR", flag: "🇫🇷" },
  { name: "Germany", dial_code: "+49", code: "DE", flag: "🇩🇪" },
  { name: "Greece", dial_code: "+30", code: "GR", flag: "🇬🇷" },
  { name: "Hong Kong", dial_code: "+852", code: "HK", flag: "🇭🇰" },
  { name: "Hungary", dial_code: "+36", code: "HU", flag: "🇭🇺" },
  { name: "India", dial_code: "+91", code: "IN", flag: "🇮🇳" },
  { name: "Indonesia", dial_code: "+62", code: "ID", flag: "🇮🇩" },
  { name: "Iran", dial_code: "+98", code: "IR", flag: "🇮🇷" },
  { name: "Iraq", dial_code: "+964", code: "IQ", flag: "🇮🇶" },
  { name: "Ireland", dial_code: "+353", code: "IE", flag: "🇮🇪" },
  { name: "Israel", dial_code: "+972", code: "IL", flag: "🇮🇱" },
  { name: "Italy", dial_code: "+39", code: "IT", flag: "🇮🇹" },
  { name: "Japan", dial_code: "+81", code: "JP", flag: "🇯🇵" },
  { name: "Kenya", dial_code: "+254", code: "KE", flag: "🇰🇪" },
  { name: "Malaysia", dial_code: "+60", code: "MY", flag: "🇲🇾" },
  { name: "Mexico", dial_code: "+52", code: "MX", flag: "🇲🇽" },
  { name: "Morocco", dial_code: "+212", code: "MA", flag: "🇲🇦" },
  { name: "Myanmar", dial_code: "+95", code: "MM", flag: "🇲🇲" },
  { name: "Nepal", dial_code: "+977", code: "NP", flag: "🇳🇵" },
  { name: "Netherlands", dial_code: "+31", code: "NL", flag: "🇳🇱" },
  { name: "New Zealand", dial_code: "+64", code: "NZ", flag: "🇳🇿" },
  { name: "Nigeria", dial_code: "+234", code: "NG", flag: "🇳🇬" },
  { name: "Norway", dial_code: "+47", code: "NO", flag: "🇳🇴" },
  { name: "Pakistan", dial_code: "+92", code: "PK", flag: "🇵🇰" },
  { name: "Philippines", dial_code: "+63", code: "PH", flag: "🇵🇭" },
  { name: "Poland", dial_code: "+48", code: "PL", flag: "🇵🇱" },
  { name: "Portugal", dial_code: "+351", code: "PT", flag: "🇵🇹" },
  { name: "Qatar", dial_code: "+974", code: "QA", flag: "🇶🇦" },
  { name: "Romania", dial_code: "+40", code: "RO", flag: "🇷🇴" },
  { name: "Russia", dial_code: "+7", code: "RU", flag: "🇷🇺" },
  { name: "Saudi Arabia", dial_code: "+966", code: "SA", flag: "🇸🇦" },
  { name: "Singapore", dial_code: "+65", code: "SG", flag: "🇸🇬" },
  { name: "South Africa", dial_code: "+27", code: "ZA", flag: "🇿🇦" },
  { name: "South Korea", dial_code: "+82", code: "KR", flag: "🇰🇷" },
  { name: "Spain", dial_code: "+34", code: "ES", flag: "🇪🇸" },
  { name: "Sri Lanka", dial_code: "+94", code: "LK", flag: "🇱🇰" },
  { name: "Sweden", dial_code: "+46", code: "SE", flag: "🇸🇪" },
  { name: "Switzerland", dial_code: "+41", code: "CH", flag: "🇨🇭" },
  { name: "Taiwan", dial_code: "+886", code: "TW", flag: "🇹🇼" },
  { name: "Thailand", dial_code: "+66", code: "TH", flag: "🇹🇭" },
  { name: "Turkey", dial_code: "+90", code: "TR", flag: "🇹🇷" },
  { name: "Ukraine", dial_code: "+380", code: "UA", flag: "🇺🇦" },
  { name: "United Arab Emirates", dial_code: "+971", code: "AE", flag: "🇦🇪" },
  { name: "United Kingdom", dial_code: "+44", code: "GB", flag: "🇬🇧" },
  { name: "United States", dial_code: "+1", code: "US", flag: "🇺🇸" },
  { name: "Vietnam", dial_code: "+84", code: "VN", flag: "🇻🇳" },
];