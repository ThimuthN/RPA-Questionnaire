// Curated cascading location data: Country → Region (state/province/district) → City/Town.
// Not exhaustive, but covers the common locations for the three supported countries.
// A free-text "area / street" field always lets users add specificity beyond this list.

export interface LocationRegion {
  name: string;
  cities: string[];
}

export interface LocationCountry {
  code: string;
  name: string;
  regionLabel: string;
  cityLabel: string;
  regions: LocationRegion[];
}

const SRI_LANKA: LocationCountry = {
  code: "LK",
  name: "Sri Lanka",
  regionLabel: "District",
  cityLabel: "City / Town",
  regions: [
    { name: "Colombo", cities: ["Colombo", "Malabe", "Dehiwala", "Mount Lavinia", "Moratuwa", "Kotte", "Maharagama", "Nugegoda", "Kolonnawa", "Homagama", "Kaduwela", "Battaramulla", "Rajagiriya"] },
    { name: "Gampaha", cities: ["Gampaha", "Negombo", "Wattala", "Ja-Ela", "Kelaniya", "Kadawatha", "Ragama", "Minuwangoda", "Veyangoda", "Kiribathgoda"] },
    { name: "Kalutara", cities: ["Kalutara", "Panadura", "Horana", "Beruwala", "Aluthgama", "Matugama", "Wadduwa"] },
    { name: "Kandy", cities: ["Kandy", "Katugastota", "Peradeniya", "Gampola", "Nawalapitiya", "Kadugannawa", "Akurana"] },
    { name: "Matale", cities: ["Matale", "Dambulla", "Galewela", "Rattota", "Ukuwela"] },
    { name: "Nuwara Eliya", cities: ["Nuwara Eliya", "Hatton", "Talawakele", "Ginigathena", "Maskeliya"] },
    { name: "Galle", cities: ["Galle", "Hikkaduwa", "Ambalangoda", "Elpitiya", "Karapitiya", "Unawatuna"] },
    { name: "Matara", cities: ["Matara", "Weligama", "Akuressa", "Dikwella", "Hakmana"] },
    { name: "Hambantota", cities: ["Hambantota", "Tangalle", "Tissamaharama", "Ambalantota", "Beliatta"] },
    { name: "Jaffna", cities: ["Jaffna", "Nallur", "Chavakachcheri", "Point Pedro", "Kopay"] },
    { name: "Kilinochchi", cities: ["Kilinochchi", "Pallai", "Paranthan"] },
    { name: "Mannar", cities: ["Mannar", "Nanattan", "Pesalai"] },
    { name: "Vavuniya", cities: ["Vavuniya", "Cheddikulam", "Nedunkeni"] },
    { name: "Mullaitivu", cities: ["Mullaitivu", "Oddusuddan", "Puthukudiyiruppu"] },
    { name: "Batticaloa", cities: ["Batticaloa", "Kattankudy", "Eravur", "Valaichchenai"] },
    { name: "Ampara", cities: ["Ampara", "Kalmunai", "Sammanthurai", "Akkaraipattu", "Pottuvil"] },
    { name: "Trincomalee", cities: ["Trincomalee", "Kinniya", "Kantale", "Mutur"] },
    { name: "Kurunegala", cities: ["Kurunegala", "Kuliyapitiya", "Mawathagama", "Pannala", "Narammala"] },
    { name: "Puttalam", cities: ["Puttalam", "Chilaw", "Wennappuwa", "Anamaduwa", "Marawila"] },
    { name: "Anuradhapura", cities: ["Anuradhapura", "Kekirawa", "Medawachchiya", "Thambuttegama"] },
    { name: "Polonnaruwa", cities: ["Polonnaruwa", "Kaduruwela", "Hingurakgoda", "Medirigiriya"] },
    { name: "Badulla", cities: ["Badulla", "Bandarawela", "Haputale", "Welimada", "Mahiyanganaya"] },
    { name: "Monaragala", cities: ["Monaragala", "Wellawaya", "Bibile", "Buttala"] },
    { name: "Ratnapura", cities: ["Ratnapura", "Embilipitiya", "Balangoda", "Pelmadulla", "Eheliyagoda"] },
    { name: "Kegalle", cities: ["Kegalle", "Mawanella", "Warakapola", "Rambukkana", "Galigamuwa"] }
  ]
};

const INDIA: LocationCountry = {
  code: "IN",
  name: "India",
  regionLabel: "State / UT",
  cityLabel: "City",
  regions: [
    { name: "Andhra Pradesh", cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati", "Kurnool"] },
    { name: "Arunachal Pradesh", cities: ["Itanagar", "Naharlagun", "Pasighat"] },
    { name: "Assam", cities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur"] },
    { name: "Bihar", cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"] },
    { name: "Chhattisgarh", cities: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"] },
    { name: "Delhi (NCT)", cities: ["New Delhi", "Delhi", "Dwarka", "Rohini", "Saket", "Noida-adjacent"] },
    { name: "Goa", cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"] },
    { name: "Gujarat", cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"] },
    { name: "Haryana", cities: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar"] },
    { name: "Himachal Pradesh", cities: ["Shimla", "Dharamshala", "Mandi", "Solan"] },
    { name: "Jharkhand", cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"] },
    { name: "Karnataka", cities: ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi", "Davanagere"] },
    { name: "Kerala", cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"] },
    { name: "Madhya Pradesh", cities: ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"] },
    { name: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad"] },
    { name: "Manipur", cities: ["Imphal", "Thoubal"] },
    { name: "Meghalaya", cities: ["Shillong", "Tura"] },
    { name: "Mizoram", cities: ["Aizawl", "Lunglei"] },
    { name: "Nagaland", cities: ["Kohima", "Dimapur"] },
    { name: "Odisha", cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur"] },
    { name: "Punjab", cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali"] },
    { name: "Rajasthan", cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"] },
    { name: "Sikkim", cities: ["Gangtok", "Namchi"] },
    { name: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli"] },
    { name: "Telangana", cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"] },
    { name: "Tripura", cities: ["Agartala", "Udaipur"] },
    { name: "Uttar Pradesh", cities: ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Agra", "Varanasi", "Prayagraj"] },
    { name: "Uttarakhand", cities: ["Dehradun", "Haridwar", "Roorkee", "Haldwani"] },
    { name: "West Bengal", cities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"] },
    { name: "Chandigarh (UT)", cities: ["Chandigarh"] },
    { name: "Jammu & Kashmir (UT)", cities: ["Srinagar", "Jammu"] },
    { name: "Puducherry (UT)", cities: ["Puducherry"] }
  ]
};

const UNITED_STATES: LocationCountry = {
  code: "US",
  name: "United States",
  regionLabel: "State",
  cityLabel: "City",
  regions: [
    { name: "Alabama", cities: ["Birmingham", "Montgomery", "Huntsville", "Mobile"] },
    { name: "Alaska", cities: ["Anchorage", "Fairbanks", "Juneau"] },
    { name: "Arizona", cities: ["Phoenix", "Tucson", "Mesa", "Scottsdale", "Tempe"] },
    { name: "Arkansas", cities: ["Little Rock", "Fayetteville", "Fort Smith"] },
    { name: "California", cities: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Oakland", "Fresno", "Irvine"] },
    { name: "Colorado", cities: ["Denver", "Colorado Springs", "Aurora", "Boulder"] },
    { name: "Connecticut", cities: ["Hartford", "New Haven", "Stamford", "Bridgeport"] },
    { name: "Delaware", cities: ["Wilmington", "Dover", "Newark"] },
    { name: "Florida", cities: ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "Tallahassee"] },
    { name: "Georgia", cities: ["Atlanta", "Savannah", "Augusta", "Athens", "Columbus"] },
    { name: "Hawaii", cities: ["Honolulu", "Hilo", "Kailua"] },
    { name: "Idaho", cities: ["Boise", "Meridian", "Nampa"] },
    { name: "Illinois", cities: ["Chicago", "Aurora", "Naperville", "Springfield", "Rockford"] },
    { name: "Indiana", cities: ["Indianapolis", "Fort Wayne", "Evansville", "Bloomington"] },
    { name: "Iowa", cities: ["Des Moines", "Cedar Rapids", "Iowa City"] },
    { name: "Kansas", cities: ["Wichita", "Overland Park", "Kansas City", "Topeka"] },
    { name: "Kentucky", cities: ["Louisville", "Lexington", "Bowling Green"] },
    { name: "Louisiana", cities: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette"] },
    { name: "Maine", cities: ["Portland", "Augusta", "Bangor"] },
    { name: "Maryland", cities: ["Baltimore", "Annapolis", "Rockville", "Frederick"] },
    { name: "Massachusetts", cities: ["Boston", "Cambridge", "Worcester", "Springfield", "Lowell"] },
    { name: "Michigan", cities: ["Detroit", "Grand Rapids", "Ann Arbor", "Lansing"] },
    { name: "Minnesota", cities: ["Minneapolis", "Saint Paul", "Rochester", "Duluth"] },
    { name: "Mississippi", cities: ["Jackson", "Gulfport", "Biloxi"] },
    { name: "Missouri", cities: ["Kansas City", "St. Louis", "Springfield", "Columbia"] },
    { name: "Montana", cities: ["Billings", "Missoula", "Bozeman", "Helena"] },
    { name: "Nebraska", cities: ["Omaha", "Lincoln", "Bellevue"] },
    { name: "Nevada", cities: ["Las Vegas", "Reno", "Henderson"] },
    { name: "New Hampshire", cities: ["Manchester", "Nashua", "Concord"] },
    { name: "New Jersey", cities: ["Newark", "Jersey City", "Princeton", "Trenton", "Edison"] },
    { name: "New Mexico", cities: ["Albuquerque", "Santa Fe", "Las Cruces"] },
    { name: "New York", cities: ["New York City", "Brooklyn", "Buffalo", "Rochester", "Albany", "Syracuse"] },
    { name: "North Carolina", cities: ["Charlotte", "Raleigh", "Durham", "Greensboro", "Winston-Salem"] },
    { name: "North Dakota", cities: ["Fargo", "Bismarck", "Grand Forks"] },
    { name: "Ohio", cities: ["Columbus", "Cleveland", "Cincinnati", "Dayton", "Akron"] },
    { name: "Oklahoma", cities: ["Oklahoma City", "Tulsa", "Norman"] },
    { name: "Oregon", cities: ["Portland", "Salem", "Eugene", "Bend"] },
    { name: "Pennsylvania", cities: ["Philadelphia", "Pittsburgh", "Allentown", "Harrisburg"] },
    { name: "Rhode Island", cities: ["Providence", "Warwick", "Cranston"] },
    { name: "South Carolina", cities: ["Columbia", "Charleston", "Greenville"] },
    { name: "South Dakota", cities: ["Sioux Falls", "Rapid City"] },
    { name: "Tennessee", cities: ["Nashville", "Memphis", "Knoxville", "Chattanooga"] },
    { name: "Texas", cities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso"] },
    { name: "Utah", cities: ["Salt Lake City", "Provo", "Ogden", "Lehi"] },
    { name: "Vermont", cities: ["Burlington", "Montpelier"] },
    { name: "Virginia", cities: ["Virginia Beach", "Richmond", "Arlington", "Norfolk", "Alexandria"] },
    { name: "Washington", cities: ["Seattle", "Spokane", "Tacoma", "Bellevue", "Redmond"] },
    { name: "Washington, D.C.", cities: ["Washington"] },
    { name: "West Virginia", cities: ["Charleston", "Huntington", "Morgantown"] },
    { name: "Wisconsin", cities: ["Milwaukee", "Madison", "Green Bay"] },
    { name: "Wyoming", cities: ["Cheyenne", "Casper", "Jackson"] }
  ]
};

export const LOCATION_COUNTRIES: LocationCountry[] = [SRI_LANKA, INDIA, UNITED_STATES];
