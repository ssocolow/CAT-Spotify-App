const clientId = "41fe19ab8adb41b587527634a55d09e0";
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

// Vercel vs Localhost
// const redirect_uri = "http://localhost:5173/callback";
const redirect_uri = "https://cat-spotify-app.vercel.app/callback";

async function doThings() {
    if (!code) {
        redirectToAuthCodeFlow(clientId);
    } else {
        const accessToken = await getAccessToken(clientId, code);
        const profile = await fetchProfile(accessToken);
        console.log(profile);
        //populateUI(profile);
        let link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
        document.head.appendChild(link);
    }
}


export async function getAccessToken(clientId: string, code: string): Promise<string> {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirect_uri);
    params.append("code_verifier", verifier!);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    localStorage.setItem("accessToken", access_token);
    console.log("saved access token: ", access_token);
    return access_token;
}

async function fetchProfile(token: string): Promise<any> {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

// function populateUI(profile: any) {
//     document.getElementById("displayName")!.innerText = profile.display_name;
//     if (profile.images[0]) {
//         const profileImage = new Image(200, 200);
//         profileImage.src = profile.images[0].url;
//         document.getElementById("avatar")!.appendChild(profileImage);
//     }
//     document.getElementById("id")!.innerText = profile.id;
//     document.getElementById("email")!.innerText = profile.email;
//     document.getElementById("uri")!.innerText = profile.uri;
//     document.getElementById("uri")!.setAttribute("href", profile.external_urls.spotify);
//     document.getElementById("url")!.innerText = profile.href;
//     document.getElementById("url")!.setAttribute("href", profile.href);
//     document.getElementById("imgUrl")!.innerText = profile.images[0]?.url ?? '(no profile image)';
// }

export async function redirectToAuthCodeFlow(clientId: string) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");

    // for use with vercel
    params.append("redirect_uri", redirect_uri);

    params.append("scope", "user-read-private user-read-email user-modify-playback-state user-read-playback-state");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function togglePlaying() {

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
        console.error("No access token found in localStorage");
        return;
    }

    const isPlaying = await getPlayingStatus(accessToken);
    console.log("isPlaying: ", isPlaying);

    if (isPlaying === null) {
        console.error("Unable to determine playing status");
        return;
    }

    if (isPlaying) {
        await pausePlaying(accessToken);
    } else {
        await playPlaying(accessToken);
    }
}

// get a country code ISO 3166-1 alpha-2 country code
async function getOneCountryCodeAndGenre() {
    const countryCodes = ["AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR", "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MK", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS", "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW"];
    const countryNames = ["Afghanistan", "\u00c5land Islands", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia, Plurinational State of", "Bonaire, Sint Eustatius and Saba", "Bosnia and Herzegovina", "Botswana", "Bouvet Island", "Brazil", "British Indian Ocean Territory", "Brunei Darussalam", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Cayman Islands", "Central African Republic", "Chad", "Chile", "China", "Christmas Island", "Cocos (Keeling) Islands", "Colombia", "Comoros", "Congo", "Congo, Democratic Republic of the", "Cook Islands", "Costa Rica", "C\u00f4te d'Ivoire", "Croatia", "Cuba", "Cura\u00e7ao", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Falkland Islands (Malvinas)", "Faroe Islands", "Fiji", "Finland", "France", "French Guiana", "French Polynesia", "French Southern Territories", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Heard Island and McDonald Islands", "Holy See", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran, Islamic Republic of", "Iraq", "Ireland", "Isle of Man", "Israel", "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, Democratic People's Republic of", "Korea, Republic of", "Kuwait", "Kyrgyzstan", "Lao People's Democratic Republic", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macao", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia, Federated States of", "Moldova, Republic of", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands, Kingdom of the", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Niue", "Norfolk Island", "North Macedonia", "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau", "Palestine, State of", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Pitcairn", "Poland", "Portugal", "Puerto Rico", "Qatar", "R\u00e9union", "Romania", "Russian Federation", "Rwanda", "Saint Barth\u00e9lemy", "Saint Helena, Ascension and Tristan da Cunha", "Saint Kitts and Nevis", "Saint Lucia", "Saint Martin (French part)", "Saint Pierre and Miquelon", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Sint Maarten (Dutch part)", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Georgia and the South Sandwich Islands", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Svalbard and Jan Mayen", "Sweden", "Switzerland", "Syrian Arab Republic", "Taiwan, Province of China", "Tajikistan", "Tanzania, United Republic of", "Thailand", "Timor-Leste", "Togo", "Tokelau", "Tonga", "Trinidad and Tobago", "Tunisia", "T\u00fcrkiye", "Turkmenistan", "Turks and Caicos Islands", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom of Great Britain and Northern Ireland", "United States of America", "United States Minor Outlying Islands", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela, Bolivarian Republic of", "Viet Nam", "Virgin Islands (British)", "Virgin Islands (U.S.)", "Wallis and Futuna", "Western Sahara", "Yemen", "Zambia", "Zimbabwe"];
    const genres = ["acoustic", "afrobeat", "alt-rock", "alternative", "ambient", "anime", "black-metal", "bluegrass", "blues", "bossanova", "brazil", "breakbeat", "british", "cantopop", "chicago-house", "children", "chill", "classical", "club", "comedy", "country", "dance", "dancehall", "death-metal", "deep-house", "detroit-techno", "disco", "disney", "drum-and-bass", "dub", "dubstep", "edm", "electro", "electronic", "emo", "folk", "forro", "french", "funk", "garage", "german", "gospel", "goth", "grindcore", "groove", "grunge", "guitar", "happy", "hard-rock", "hardcore", "hardstyle", "heavy-metal", "hip-hop", "holidays", "honky-tonk", "house", "idm", "indian", "indie", "indie-pop", "industrial", "iranian", "j-dance", "j-idol", "j-pop", "j-rock", "jazz", "k-pop", "kids", "latin", "latino", "malay", "mandopop", "metal", "metal-misc", "metalcore", "minimal-techno", "movies", "mpb", "new-age", "new-release", "opera", "pagode", "party", "philippines-opm", "piano", "pop", "pop-film", "post-dubstep", "power-pop", "progressive-house", "psych-rock", "punk", "punk-rock", "r-n-b", "rainy-day", "reggae", "reggaeton", "road-trip", "rock", "rock-n-roll", "rockabilly", "romance", "sad", "salsa", "samba", "sertanejo", "show-tunes", "singer-songwriter", "ska", "sleep", "songwriter", "soul", "soundtracks", "spanish", "study", "summer", "swedish", "synth-pop", "tango", "techno", "trance", "trip-hop", "turkish", "work-out", "world-music"];
    const top1000artist = ['5UUFp9egC7mN69xkztll8G', '3s0ACywyYmmUv30FuRpTx0', '3PG1MCCCJsv6T0R7SPxt2e', '5IIaFHMPl5ske0mr4PUvuX', '2W5spAZZzDzClckPWT0oAS', '0mC0L8i7l7bfiSvggi6aDg', '39qqeS24ER7B90jwRaPYhG', '3cK62RyLCP5oMLdEeQuHPi', '32oZhuCYXz1bFeX4mKy3g8', '5dqkgY6P5XqMeWMx2IvpyE', '4IcVpMl3kdRm6MKMVgaXxs', '2TCiyxY2UuscwAtuck7A5n', '0XctTsh33xqvvkyp3AHvI8', '16KYmEBHNWieo2vyDdXImp', '6V4GHBALtP9RDeN7ZZID3C', '5CoeTt9oZZ6Vb0MuvNMKWv', '3jS7z8Dw7JLpZ73YCCiH98', '2NiWIaGKDoS4UJYDiCT32x', '2dJdmSaC9vrKwEfPssqcni', '6fVv4OftvEnSajpJzdDtGq', '2kVkEo2wJfS6UHQEpryLt9', '4dx6YTrSFQjBJgqtdvUpbe', '2MDCq4CFWTalvWpu6jHImg', '2qYkK15vwDv78El6Jn9UZP', '3xqYfLlwJkQ5v0elDlNTul', '36Zc6A9b0FWZtoYQ1QIYh8', '6puuYYo43ZAGeOSfUSmiUF', '5HpI0yxhjUdEUpQqa818Ac', '0FY2KQat6CvQk0IR1KtnCs', '1iVl8EKmaZMMClbLACyh7X', '5zhseewCBnAem4Zcbg8qia', '0i21ELFscuhvnqdkmZuDcS', '4nqdWLiZYU6D9xYwzllfHy', '64jpO5s5EQyb5kFI22jXsA', '7BWaPDTykGRNJbglrxIC7Z', '7ecaXfA0nJPCnSSbpcpMp0', '59XJYCZWfBROr0J5XL0Inu', '1kd3mtv5c4csn9Rqw2RFLf', '5YPD8A9PpKp7lUDs0j6oFQ', '3pPdOaWjnnMV0570NUUz4t', '438LS85kXWLIiR1HfKQMq0', '5e4hPudNbELIXrEhRIjBnJ', '4rIaStyKjJlkx3LCwhmVxe', '60BJh3vfwz8PIkH4vCLuwq', '30F54M12oPN40MZgnAERQB', '3C82jL6ise6gsG8mT8y2k9', '68tT8pt8EZXe7cFrPjUOzT', '62AWQLF3BJiV64mlbDsbhM', '0rY9o0muG9mw5vKiIUeW9S', '2wy29RBixBECDOsXuBs7md', '48rm8lXUW9xp0EnmqC7Bzu', '2eHzMhR3yMx7r66idFu0V1', '5Mw6cLNaVFbyM2hnIGdWCe', '68x45MVBi3jFRFrdC4hFmk', '0WA5YLR9zI2d6JfNCi0V0J', '6EbEF5LLL7Oqp6UcjfYibf', '7gy3ypHbCv3gehPqMpgvfl', '5wo8cml1hKMByTMZJW0yv7', '6VgfdNIe4GvefG0YQwgU7a', '5S1PFtdYs6xM2TiuZd6bAt', '2isoGqi07qdcDbx7UXEcSI', '74h8jPe9Xbc05Rt4yZzzAv', '1T7eTBVCpdjXDJhpCCmeFR', '57uXzlYEOrsNYrTAK5unXr', '5vSsQH8wH68PDKJbNfxzpc', '0KxzO6ZP8mq8Aml11XiVEO', '4qT0IV51T7tE8TeoONJR5X', '04nPGjJJTJL1PFgwgiKG2H', '28cunIfhD5BkPzwumxy1T3', '1tgCGmTU3ROQfszdqObaZS', '4SwGtjqBvoqupw4HxRljEE', '6ytPTGhq5dQn7XbpJ2GcNA', '0UmVA2pTlalzEMpdh12Pe4', '0PRpDQIcIIGOhPyfxCV4j3', '3bICLqErW1avxEuCbShHXc', '6x87ejWlGZWg44HACeAEqK', '1O21Jo4liYgc7O2Oyp7HEp', '2p01drTiAZIXSAGGYHDtmA', '2BMFCA9qtbKHxHkwLpRMxc', '0noVd1VU93X8TEZMmpR3yN', '5T14qzn2yOia8bLEigbuVr', '6GR5KkRvzbXie3Oeu22SLz', '0rWEkMZhwIyjdvo1PosBmv', '69pnjAws2uzNZJEK64p9JI', '4NLZCH9YmrIzkei4fqjwyW', '01bxMdpn9t2FWsyXMbZUOe', '5gT8WvHJOOUpxPNblCKyRB', '69UGiOsqeioL4ZVAkdLSS7', '0IcBMAsqBAOItsprVN6FAe', '1o5PLOy2ilj8Ag9b90jVWS', '7cSYClw6Wv8KKwdGAre77A', '74WVivCxwoeGWJd0bSFi4B', '5HpfiwGVdixcWofopuqHcp', '2EXFoUQZcYV561qPFJrU28', '52JM8kU3pHQy2QNLnQYpbC', '6fNrKcr5kd7loOOVfez3AH', '3Hkp9NQj6VMqvE3li67v6J', '0orEEVWrXLMHc7Sb4Kt7lO', '26FXlqKg3B2AWONdZD6M5L', '4j0CHeSLB6HvapOeSQYZNt', '2gRfSK6vh6p2WZeeA5DU0S', '5EMaHrjwR4T2etHH3QCZGD', '1MQsqcerFlZIOcyTCBPlRJ', '5TfVRrIBpOgn1JyDIT4XHA', '0a32jC19qBFOvFkqldsNBA', '3vR63Gb2BSbNzcEca53Q4N', '6wJ2h2gFl4gdLHihvwhUCN', '0Vo7ojYFM3tMND0jyJVsVL', '58pdpjuyTSgkKs3vv27IhY', '4o99wL38LBRZCrYyfnYJma', '4AuCyfJMoveO6SJ1hVgGBj', '5OTdC7Hizp93Z4KaYb4zI3', '4f8p4aT6uXgfJr27BOCipB', '4mP0KPTTkAzn0O7UNxhhmH', '3zqQRtyxZXBoqcWJHH6acA', '6fk4rOis6GK3h6RrHOsJMh', '4xr1Azj8mCbz6u8CITf8ef', '6864We4jZF983XILlGlbLg', '3MjTrYeAdcY4guKtehnrYn', '6CTrhhZryZvNxbRmFCRQ90', '0nnrDjZrTl978dHj41x4Nu', '4fxSA1sRLstU5TnTXcaxmm', '2Ad98dK6zkJl1IiCuYLe6N', '4rZ8LNu7owIeRgmw7UnA5R', '55FYNdtrNKBGL9u4OJuZdf', '6sJQe2DAWefO9Wz6lJg3sP', '5rrV7O7cDjFLbH8BF7TblQ', '6UIySQKUlXJlVO0XYlLC3z', '67siMkMtDIp6WkOmoVeoEa', '6mQo2BEEd1BiSiYjWB0qgI', '0rWu35QImx3DkegaR9gX59', '57jW6m7akrdqZ91jstIXuv', '4ha08Bx9FiLGpUJNmWjnsp', '1gIzKeaF0ZZipXhJbUkCV8', '3DuthJJX4QnBDfyQucF4dQ', '4FfrkV3frXRT2uFaVotGzI', '1qDJJRmPVD8wg9sIDUTlaX', '1sDITOwHHe7POmTSCGcVxN', '0Q9pKBQXZyg2UFIvHBnXp1', '2gfrH2foqgJmO7UzOeHmrA', '01QsEcF1mWDya0hV7kYVp1', '51a8EprToYxJeRZVkxh0er', '7vCfDFyEMCK6vFpEstRT2A', '5u5oheCYVYbg8E0swCroK1', '3nwUX7DkMuGPcuHrOXN5VM', '0oznXWGYeKhHjIvZK6gXjE', '0KruoSYqqB5CFiLNcEQJon', '7FN2DD0MiiXoadvyMmsyX7', '7zLtbktgnqkMEddGQ8rRO8', '1gJ9bguy3gnj3yDm9rnpfK', '52n7xNTVHzSyyKTYQmgBj3', '3F3TLkM0O1IF2YfTPZmIzp', '6cUetUqVyjdPNuxQ9n5zFu', '0VWQwLfjgpttoqSVCiVVEd', '3cQ0XglK7GSTaOiEyIlCjv', '3KYPWSBj0RxiR4Oe3xjW4i', '0NThNupSihWs5kR2xUoCik', '0R2BQmqtNBaajKeO9qU6sB', '0N7uGstUue5kWw6X1oNL4B', '5gXKDmafOQ8i4lYr62wxTk', '4pfjpigH1s7Ix1nxsSNiKk', '5hiRFq1bMfEf05ashnEmHB', '7e0GZBhmcIlDVelgARxHfc', '21KciQARcxrdutUcLI2tLH', '2b2aRoa2mFXlodF0k5qRix', '1RztZ8mTPuibGbMI8zF5yo', '52pwA1iU52tQgGMlZDAsNI', '0Z03QN7vDo9vFZEEqr2tT3', '1qPhzT0e9RtbMmgzF63u5q', '6KETWZrxKsE9YCXmB6HJsy', '6sskRCrAsP937sxflAhwu7', '4lRyDKi6tPsPneyhoT3wo6', '2iADz4eSSEZ05F7edbRtl0', '0IrUGoktePgy98A5nM8A5r', '1denQKmQv1dCz6JIphRbug', '5EJ2Y3o4Nfz4N3MXBfudxO', '4Wgz1dwWIp5OCT0QWC2Hl9', '3EBTdBKOUPG5T9eGEVaLt3', '5HiuKJucaEWcwKj4db1OSi', '2UbMB64x9jcNvYHNmGiYTg', '3s1peb6PnHB240NkbR80Vv', '5ToEKCGYeJO4YqkAXFTyOO', '7fxtp0dy7mxfE0fqOgG6gI', '1YRAeHDnX2fY7NdkCt5ijY', '0SnNCtdKvmfQcH8HvnYbse', '4xDtFd5cMMRVTUP0xGxJES', '6acBgrFyiFTlDMZdtnF68X', '2PKYdXs9Xnkc4z9ilZpnHj', '1YtkMWzAioyzvtyIVjDmwY', '3hP6UCCQDAZfC79wl5j62R', '45ElwPMeCsQHv5e8KfjIE0', '7kPa44fWW9s9ZDpndM59ar', '5tG0QxkDDJPQHkR6I4gHee', '5LdaKmQ4rg5py2NGegkRQg', '4AHnPcoUJcbXEft4cLPkBP', '29ancNNn2qjHj1NsVqTajS', '5X9uQEWx0JEfljOHz3ckVp', '5pIzJSUwghw5ThOB5YxBlj', '5VXjn0eAOSU8GCPm1sAszX', '2f2YU3YlacJpGAmvkFNPNw', '1tjKSY1PwexDy2jQNeP6xx', '6tgL45yUaOILSvoTjUdedi', '2xXRuPv5VEHNBOwmPCOxlw', '5W28mEycxWtN91EFNeeJHg', '17eAzIqFQCskhxeGqaX0oq', '2wwvaBvncQQBFmovuoSX9B', '2ZmW7Fk0ViBTN1JTrFD3Bs', '1ltSaR5JDCklAV6VcGxNv7', '2OILwVcSPPmaBjiCW4Qj8p', '2lZzKKgZuuShB5SxLUT6RV', '6EFFe9EkDlUX3citk8TYyP', '7erAIecYrbde90ic2cKKFK', '7u0rQxwidOtXVOE4wsEwog', '5RcNCCdYW1Z3inQJ4M7thg', '1BYOO4VoK18IwyVmLuGhxT', '4LWH4dLNkCsANAmZksbO83', '4Pb7Mg18H4S0jCGgH6bIIq', '6gdsl8u2tQ12yhwYRMB12T', '2RwZZWM5etkWMawplnJX4u', '30lChacPKpnettEidBerpk', '4DQEgewQDuJuhPVXSHHJnN', '075Lu2YqoUCE3guPofRxuc', '4TQYdxl102w78iCxRIRZxb', '3x55ruWsb6QtuufuCTxymf', '6oz4C8W5Z2mVdsZW9tFQKp', '4qDPQH9Dfp7A1uu37zjysA', '5XdDIlIqPOjs4Aeva2je2D', '1Qglx6Hu16uEcwJOqAE115', '35WbNTnluUh6G9S5b0NOgj', '4eNDlbG4ifriKDRQvU1CUN', '3MF18NG64RyY9qnrHZZSlw', '3XWLxjFW3eSvmSoPtENUhn', '22AFDxIMbAD9EB2x0Amxaa', '5jiUDV48uIPBc0kMiHL57V', '3UjDqHYC2ynSxkPCkl6TTV', '797AL4PTAgNqomKBmtLtjG', '5ORo2F8zMyvbctQJIIO9Wj', '0SNNtCi6YXrc9b4A49WYGb', '7ns0hyJXSPKhDuMv9PuWW9', '7b6vEfi1DJ9E5HkyG2sNfi', '1E8uHhbPcJpk7t88KkQzK1', '53FSRCsrCy9I2cs20df77d', '0eqSAPj25ty7hqlo79Ir9L', '4nr7ndQga9lroSeBjQBiFu', '1ibzbXc9frI8bsjTgQlPj8', '72TIjAW11mnWHTGGGbkRch', '7GWIyXGf8u97sYUZTrqnWv', '3s8BbIQN7by3SoTFuM3Ndx', '4AMlvhGdATpEEIzwB0zTfz', '0Hnm7y19vetNGpBApuQFMY', '6WD08JNFxt0lRFX1cpXrHb', '0pqJfG9Kso0BRd1OmzUCG4', '1j16DrcqwqTrfOQY5BcT1j', '5OT05fCsD04uyZsAL4gBvB', '7HQ3aCTbdzdg62cJowcGUV', '3JV2K1C2Bd9JD8zjoqeZ49', '0t12bk2op5w6GLo3FJw6ze', '5e5I3LPLDrazXcdKraPElw', '4jtwevAhHXJtRdRQcHocZ5', '3wBvIPL1ZkVIlM20xGrZ6n', '6fr1oGWhDjazOV7gEAKZlh', '0vEV6pR0OVFJ95LW1bMqRr', '3sQBMQEMd8YKcTVWfsXhcb', '5HZQipw98poTN9zRpZIkQO', '5t9DC2OzPcp4HlJsXOnvbh', '40BsEMOHVy6DAjofndUQ6x', '2y7YJZCUabTfkf7yAJYB9i', '5cqXUv2kcFEhGgY3Nwhszy', '3AOAS3ocSHPaHXvhe3eiWt', '3wCVr33GXo4EqA98K1UXpi', '3Vq3v1yVcp5FpQ8tSn2GMd', '6kOsU1Ladx0RsWOr9E1lPk', '35fyG2ZCN0ijlNiBbJ3n9l', '00u2onQrvoz0VBJjMJDj48', '2EJZYwvixuanC3vhK36ibW', '5jOblsQvs6QTw1nS6jn0kN', '4vPJXzwWlLjYser0Qcmv49', '5L78F8C7dYWDzHFcNk4amq', '6GgMexp5oD2pre2xZb1O6c', '46b9z0oabOT8z9vlCrXPNX', '594GxAJXqgQC38BRZu8RG4', '3eiXrec24mFTStJH5YqRGV', '6OO96onEJl8PYH3pihJTnI', '2OsHcxAE4E9n7z57yN5VAl', '3XnpAbd219zgPyZGPfn8HC', '0sdhm9lOWy4WqYYdKm48uh', '6Pvaumhcu0gyXzQ4XT26sf', '7mV8UxnLFInQTaDrsXvfDF', '3LsiTVim2hBRogdJxiJ3Ry', '6HYJDIhyNPECOOhaEueoTF', '1dRok3FKQlhYlzxs1bSiM6', '5PRUaswJTNpb3KbtPoWhju', '7FfO0eblBYav0SsthnzT64', '34ZFbpUbQmy4En7xohEaCG', '6Ao4cbmrJ6omlpO6lm8yLX', '5H3KxHrcRFMyQ6o2dNxOvk', '0OtmhC4G6HVXSstkVCPRmL', '5aUNkxpVzl9aBMTVimODhL', '1Vd0WyAomJGTU7b6Z46W03', '6TOavBVFezinsiymjiqAlI', '3CYL4xHDrpMI1SEohE6P5H', '5WID4Dm1MktMmsnGksMeSz', '0Y95OEnDP4zgxW7A5NPoKN', '6TmQxKR3UmBESjB3ZVXH6R', '4jFabatgq4SjS27krYiXV1', '4ncMuUQQnnHGEZMSUjyVru', '0mtIQKs3F9vlofkBKP6bgx', '5dlmVFEhswX1I0704LlyiX', '0yqZTUdL0Mse0Vl30i5Syr', '3WO5OSp8pvBtdzVjnO3GHI', '5d3bfM0AJpimbL5CF2OXyO', '0QuJBEhGVYcxIkCqE9aCSC', '3hQlz2fgNZRcFTzttrKnbc', '37NSuJjlVpHVLzsczJ1fe2', '1vldQihMz6A5SpCCFP8pjo', '5d0mx2RZ6Wwi9jNjGdBz1y', '4ixQnZ2bnKKqPSQRNGX23v', '5UhpYsnGYN3UleqcuwtICA', '212tQ3HolstaFcd78jpjrO', '1y5vlU9pxaDI3HyjP17wSU', '1avv7iCleXPpbccQzP7tfO', '58UBXVPmrWoPdruRqvNReu', '05aWwGFiy56ROICYyAMLe5', '1r2tEsqmp0N1izLkYpa1ro', '2CpM7jfaQNmgjNQxEzIEVy', '2rXHDN2W5Jl3xRkhUSvS9i', '4NtIJlZ1npk0JUEtWSbPYg', '2uqc2BZtZXkeo6O8AUGmmd', '1bo1YUmaRWQMBYPoLZcfty', '6oBCORvGD16mZ9bGOcLtXj', '47wAu2rJmKwCHulpcrRvYP', '62Mx86q5VEiqqw0Hnjtupl', '0qk7e4VAnp4YSnfN5b03GX', '2t1rAU9tswttJrABhJyCql', '6TgiMaBO0HIoeOhUlEvAxs', '1JKBybDRR1ugiaW5GhCufk', '04RGASAXqnt4YtPf4K1lyY', '60UKKwL6Y75Q7puBqptFSD', '0tRQ1KKKRgAJxAQfE8b6nW', '60wwxj6Dd9NJlirf84wr2c', '23PHD3dgAmNpfg5xGxMg6T', '131SCKxgT2Rf5pVXoK2DGv', '1tFejokZE7vIS0BzQaj4RX', '31PWf9xgBHWEgVz2RceNRA', '650IoSOmTWS33SCkKkQBd1', '60ZFa4LqJ8WhjWuCuQA0Fw', '27fAWLPNIku5blqTmLv8bE', '0q4FZtQHF56LqkIRLPdY2Q', '0oWtPDUbrZY1idnbq70ioi', '1L8tRYYrbpVSKwP6ZjYozy', '0XuN6E7e5LmS3g8mS7iEmV', '3Wvw6sieM2VgKsWZfoqt3F', '6atYClF2HaaJl3tPhzv0K6', '5lLpIhfhPGiU45tA5dYyH5', '4enpm6PXOBLhWasBJQW8vR', '75d3gjlNm66KV3dxWtNFB7', '3ZP89Ai0wNkdPAdi47FvCs', '3ZkxTid37K0Rb9hmujJaGI', '3RxRPp05RBBWqDBYhduXBk', '3UmyCiYdT5KjSL4PPpPmJp', '0ZwOZYhdYelmk0aoqa8pC9', '3zESfsToBJ6R10OCHafF2n', '6uT5ik8y32xN2bUfbUqC3w', '4k6qsy24rYLjnWlRpqzXwJ', '4a5J1g4h83VeYWXcl87ob3', '1fiBNt0Yu1UaSw0JRSZbms', '6MAH0HSyD0kYB431snWiL6', '7e9U7kfPg5fv1MPXhDkO6G', '0CHIXgrfCIEAaIZgoRn5xx', '2VwiHVZSISNB2SpGPAYCyt', '4JG4L8G6qhHIi6KTe1KhVi', '3sucihA4j5mHvk8BWcsD0P', '7vUwNqZYKChb2nHBVAJB43', '1mkUa7lMonClanW7Bas5kI', '6Amd8NHguAMZvMbqNQicVH', '4RKeLXUWpRHzCKEYJPJRq6', '5EJQKvwyzFxpXF63DV7fRs', '5CaX8GidvchhUq9sUXSrlO', '0GWupOjU1HEqQJKhXxNzLu', '6M15ZFsGMZ7Y1zGRKupbXS', '3GhJlyYAPPAaMwDLufPx9k', '4xIohXSM3xApohFJLlvetk', '3GIFgBK7JIjgE84W3wTBtD', '1lR1ESl8VGyocVfCQvkOHW', '224kcwSPnyHuAUuv6Xl48y', '7v6zA8UquijCr6gSjkASRS', '13cTM1aVZ075aa83jw2Lq8', '661azEeGCiEfYaGba0xQWN', '0gwNGHcBRYtF7mvgUczVo1', '7CRPl0UWfYKx1wIg4SGrax', '4pg6dmWxleGubWbzyEFAPl', '1siwsM6k9QqUyq3un6QpYf', '2MQyraAUFSQgd7ihiCiL7j', '6ANV9yQe68Q3BTRyGNFFKh', '1Ca2ELRlvACAeI7xz9c9jR', '21ZPATK1enCzi85mjJ5yh8', '0RgluFQ8GoufKe9uTM43Hb', '3fwk6GboaPdndWyXbsOelV', '2GhizOuKvp1ERczYqHmhkH', '1WUNnzoLAlFbMaWnhZ0ZAO', '338tJEQIJudIjGlgnYLjQu', '7sx0a1dJE8esc838EfqdYM', '106dqdybZoV7maWIsMIqrh', '4PqNOSX9jJWLuMo6kc1HMA', '6sBe0isyyjR85tdeMpnzBs', '7I9Yt1KadJlRkMVAFouMvu', '0TYNOnVNvj87M2vy9yDltE', '2nrBBrKqsndpIkKxCtqjzp', '62Hfuc7127M5ShdSSeSckm', '5VQMGQwcNIpDegZRG43S8f', '1AWIH8gKJnD0gxDv3eIixY', '5ACw0ufKYcsYYoTLcZf0Ga', '3znO5HNP9kq2iBxzmStf64', '0rgQp5Pi4C2G8vQrhaTS7b', '4SB8qaZNfbaslX3x43Pwvk', '4k41X0DibqIjjz0fRChqE0', '1diYeyhFzuVttzygCGcZva', '3hNbNNSbSL3oTL601g4eIe', '54ijugTRoKuW1OYNFY6xgu', '6QGEdxGcAUeor8Dz1wHe1y', '74XMUtCLLEudJtL8r5Jt6K', '5GNpH5NqK2Qb8P10IPh9zT', '2KSmanGYxEH2lstIlbU36t', '3spXiW7K26TPCYr5hVJ8u3', '3LDUEKrp7pBlDxChjwaAiG', '4aLHnUEKJKhmsjtzpWT2Pm', '4w9tva5F5XUdT6oMWZyvnr', '3eVMqQIkT9oaJBspAtxZIz', '4ags8SIP4c8bDlXSrBoy3L', '79y44pQ5wSmf3QIpjEOy5U', '6IGZyProzZ6B71Tx2YQhGr', '5ptWvEd6ldRH8FP0vsKj31', '6dJxZxcSOMRZ42zKUoZHwC', '4uOv1HYqgEYrRWLoS4vGw6', '4Z25mFQyUa92qFElKTNvzA', '6YfnR3EDTUTModq6qbTPnW', '7CxTPdTpJ35o9cfH8RUW1w', '320AudJ754jC8BQAcLvipn', '3OmkIqq10pCtRzCghdOdNK', '1JfzeIQSkETo9z7UO3XooK', '7AJghm2FBTe1uwAem7tcrO', '4m12uprXedxP1nqotRkayx', '785v758iYH7Rh8JqGN16Ct', '0UdvNn02V4S7qvLBcYa6fn', '4lJ6XAp7xBsfLz7F0Cp0vI', '4BKVKOwyrvp0X9urGV6kq5', '7l9jMtm6iJlJ0yCZ6BAE90', '1caoG8pmCMz2dykdWH9U6B', '7BOlfxjvfRwaDFvaYiloeI', '7rRBAR8QXGndi6kdcd5cpA', '2hTBdWTGhi2LVITIeP7UZG', '5caZQQ6esr4pn8Ds5hUV7R', '27066e9HNQWrqn4isUlcYz', '30M6jv8Dq9wZNxiJsZ0z3r', '1FLW7yV6JFwdxPkk5GItpS', '7vX4FFlvvU8Zyvdi8hDBi4', '14HVpSRZSmH2T9p6Wba7EH', '390ES4GmUxLoNc6QRWarR5', '4kF2ybdVVoV4Gmfh0JVWUW', '7hGBbltJI6Gmq9YbbNvAzo', '0vQFYw65QtzqA3WmEYrbiA', '6pQGNENI5RC1apeOU67xxI', '7mNMMConZ5LWk8hcGPQTKJ', '4G04e7ISu8f8VBncBBIRU0', '3366Rs3H8aJKRmURrUxTxe', '6CDMNTY68bb57NeP6GvO7s', '3F3uo36lS4ebfhpxqeZFZW', '55paRlRdoV3G2sN3csToBc', '3VSHHPLmNx9zEXWuxtWjrh', '0s6BnZCanXlkFA3xb9WRT1', '07uuo1yEND3oinbFZnYOvx', '4GGrrmPZCPoe5Zq09kNuEf', '42b0hEkbq4ftRW1NyNWN7g', '3cyIi4nnhw2hDyvwWmzgFb', '6AVA0ZUmMS9NAPHv26Y25B', '7yU0CVzxfsw51AxA4x19f3', '4KBNXYXJrD4LRNPnPDFesr', '0fMz3bjORj7lIagRiVVPXj', '1iPCmoZjFScgrE2DuszIq4', '544RqpJzs54nrlCU5NzvvS', '7uuo02BIR76qZ6ZXQhz7Ys', '42Re1RR3ne5v07iVbpyEpW', '65Lz9YUH6JX0gd5AymVnUo', '0o21PxyY8Q6csa4u5SCnr6', '4ZxdFs9sqj4Qv1z7bSn9WM', '75QvbqqwBdutdwFEjAnp5U', '5YNIkQE3T4rmHaFNbcirrY', '4kiDT8CcP42aUPA3yn18z0', '4Ah1Q2XyMj7VDJQ0ClJILl', '2RdgQmyKRicDL1VuAuWPhU', '5KujIWxd2NDdsIV3qDO3Sb', '4WZd7tTKHnZN1tmGYR1CZz', '0eCD59q6r8y02UibR8vQqj', '6P1HIDEMW7bMEHXGBiTyYY', '5lGlRgFZZ7sFQcgOutUzVT', '2MaULagt5qaXtf7o2zPkdb', '4EjfhM51SWFnq7PYA4Regw', '1SMzMmZxhhXZmJN1FB4j1a', '3sOJM1K9oi1dbht9Vzjpib', '7bbY135gafWRikvA2f9jjA', '4sQwAHMbVCr0Tcumwx0cq7', '3UGF4JeUd4bjLBKDiDSMEr', '3nClnL9F0yg0sn5T5N5FBo', '77yzD9sTjM8FykboWPs4WS', '7mfShPmOwZa6tsRnTnvQ7V', '3GzzfSQHq6svBDd05ub4To', '79lY7HfbLHmjFvs1YI2otX', '3UDQlSwFRs9KGBQtUKq8Jr', '3rej7c2ZJ1iaYpmNVDcwT0', '3KUKagIVDfdvvKG0cKh76o', '0WVzZSMwXxAlbyg4PwEN1A', '5PHzodSIIweH3PKlxx1ws1', '5gljjiXpHLgN2g3hc4QJvm', '4wVi2ta9VVXhyrEyJBfx08', '7ISp1nhEWhfQET3oE7i8Pt', '17dMAOIxr4gUKKdddaCDYF', '1RDSc1VEq75TxyFOMgtWTu', '5bGX5s3GRgWFRPO3WTZjHQ', '2QF8thttdKZEmy0uJLNTSy', '5MXtI8ozZvcdsz5vVFn9OS', '5KuYsjjGr3K2wSyNUxLbO5', '2A4krn27X5nwYJ4khnUuBD', '2JQhcavFjkLO5qtNA5891J', '66tlojc0D8Z4hK2PAJMLiN', '232Mu7Ow1Mnk6PfQkd76Ha', '4SL4q1IARNLFEppPUSOzw6', '6gRY4HZcHxx1QWIEpvdAxm', '6kaBZSxp4fakla0jFqgxiQ', '31UOp6cnFzwptyB7qEk351', '2KOV2QovyeyB893fIjAChi', '42IFvIVqx82W4Tb1W2uKLo', '7EE127g0p8YQOS7rJ9Qj9p', '2dxQ1qIFDkfbyBI82A56lQ', '0hz9lCgIKOtZthsP2JTPAL', '74MlRjmOVEmnmSzMwFhsYb', '5dhRNQ6FsqjzhxgxTzHKui', '5VoCPwyzxdP48QweshNvYo', '0W5JmbmuyZoFs31aw7Lj9J', '59X7mCBxVdrNp5iYZXfXzp', '0wlvGF0fmZrC26FGir7dcb', '52MzDJpa0ZEF6iiTr5F0M2', '773VsaXBfxGYzEcoYkRDE7', '0qY2uGVTzIuaTeaGdrREoG', '6P2xbyuzhrnkPmvceGuIFM', '4txAP9uHWwuq72U6MQLBOE', '1B3xKD3HsH8LDeCLT1BHbe', '1odkKVWMA79nrKBrjIkEHL', '6simdlWUaDGgYStdOUPbss', '6tgYzomLol3vpQQRKo1Pcb', '7fFlhYQqTPH8CwdaYDA3Op', '2M52EXrWpt43tFfb23Zlak', '3exVd4ZKDRczT27hDFlD97', '3rCyyomNfjYdcRv7vEiEeJ', '1n6ASprka5pSvL9jDTGkka', '5CgUkgzaO5ITSK6WW8SNu1', '0A4ETy7ZUr3UUISHS7e6AW', '4E7YADHh5xUMZ4LH1SspIa', '5TO2LbHv1kI0xjuSiRgpxH', '13e0lX5D6zlz5zYJlEVwdU', '2ESmL5hAN0USlS1PxWKAmb', '5xFtstTBrThJj0i8mzG4uQ', '16WulAQCJiM7GISjqpYOx0', '0OLfZRLQSI6FPIAngfHvVS', '3CVRNBEgjmTIPwxBnXqCpl', '3XJri9vONfk6hAbAJOqwh5', '1Ck4aPR4FM5iIYumtdLi63', '1FKou5UB9rOqfS6ry7DT3v', '7sRx6dI9egHNPCxQZF8id8', '14EXFl8xx9q4JWryfgDl64', '2PkYMUUjACVGLsDVjMfUgY', '6UaG2T7ZXW3K3SbttX1FLY', '6HYNL17hBc4oeQ8rvRiGaz', '4Dg0FSovv3n8IBS9QMezTp', '04sOIvNuZeyvMCQaByhM1a', '0FcKmnVbJgs5c1jr6fWrHM', '5uHu31z3icbLoFMtVx2zHD', '0M762QCUiiiae48VvJKbti', '3u1v2YwHnphIid70gxcdrW', '6lfGYkgOdM4AawLmFnbNgK', '6fOgavsEFtpC17AEDXToEF', '4QYkHH3E4GgJ1POePYNFcr', '1JCYIgK2lWNAfqOsfsp4MY', '6IaXc6pc1WCoacWQax07EB', '1xnngJBD8y9YpPK4Inrxn8', '1N56dlFMVP5UBqUvzA4yFW', '3PVFDK42hk5vxBM1yjii3A', '5z5wYWL1IO6y2yEFBOiGt0', '2I0W1HmR7B1bBFoWi7LSfa', '68lCf0TiD9UfhfsgMvsjob', '4qGZja0cZLWR7ILYEKMzgq', '1fY8JSIwCf26Ed87vdDnQI', '52AVPKYmddHclPYUB3yWPY', '4aIM1lEeUGHRHSzXtbogzL', '0MOZDeAFFa6hyxuPFLbKcr', '3d0pwyoTXmomnQXoVLhBQx', '7gcvWV1PPh1TIll6ZrCc2y', '41oWHE2HBcBIsOeyG7WfkS', '0ofKCZEmgla3AzpYiMBmeh', '3MxjlbCfKM9gry4ZvX8mRb', '5jKiLt943GZm2A8TpoeL7N', '4MRMuTQwea3ZuzGbiLrvpc', '7nymqBg7kNmliKzSJiDehh', '1GQj703FQqeArbp0Q3ShGX', '51XGLhfHsXcdPRujlfSZIT', '7nNRO13w8UGcCCPtZ89waY', '5AYy1twFqfOigMtCdG6vUr', '19W3KUD9P4i8CCEsOH6Pkk', '7MPHgXUz1JtYD0ozqEQViw', '10VT1aW1WTPlPmk0IAHOjv', '5bMusj4CzZw3wGt77QiTXy', '2daElxotFUUoT5NIbqEeMC', '24Pz2NWpxtj1ZjFn4bdMUp', '7wcEYJ7dpPb7P99i8bJf6x', '5oVMmBPj1rvtRzTpjYIShV', '4ZeQ8kzvv1nBBknlgeYSwe', '1kQKvI4K3zmN1zI8ViSdeK', '7jlrYZaDZ0kziLxMt6H0rx', '2DJD0GlnplgDevjBoDHrQv', '2N2Mp4HjnYcmrZ2YqrKedy', '57VSH1HqKXmSTnv4N8hSzz', '410S92a759BdY9fLhfP0O2', '476l2UIts2L4pzjGVfsQLN', '0zi5ttm9AOOcMhuwNLjQQH', '2uiKNjQRlj90lR9Ms06NkD', '18s5HkCmbwJm1UIkDQXJWG', '0ZkhFENYKIm1ipxPVrkBQd', '7sxlsxI5x0g6bINKeJ0d2O', '1EDf7nLxhTvMRA9knxju96', '5jLnmqmW9HxBEDX9bef8de', '3e3lM9qHJgVABWbO76Uf0Y', '3mdhV5Un3XbY8fkNtxpA6X', '0uR8LuCtyxL0cDKk2Ru8gc', '2dmqHXpJJOmSyyMIlruPeh', '42mEdJuHv27KrnjWYsOFp3', '07ECF7UKD6bznvzExSaL0F', '4V2zA8IDEMnU5PLdk88t3B', '6GGvjD0lesZnXP5uhQrbzQ', '4WDZOj8EVSmUhAtl5cJXhL', '5Ge0MqeTljiZ84X7sWpipK', '39l0gBYeV7wAU6gS32r7Xn', '5w9MjndiF9BC3TrssWWf4A', '60iQ75aP8VjfQMInz1mBpw', '1L2vPdMFAeLLDKwcU4Qqp1', '59p0nAwXrILPtTa5SMtWub', '6tr2SVCzTWv2rYelX3QT9z', '1e7dNoyDnGH6QbR01djVGy', '2wTTkTaeLMczdFtPaWJVey', '3FJ7I53vbPv35gUxevaPHH', '7GGwVZuhTdBsPgJJKXOH6x', '0mkU8U8ybevy4a1q5xDpfN', '2xLurzWoeK0HfdtXUAxzxL', '77d2Hrr6wDJ82Vfnq36ijE', '1lDmHiLgwQbRKfNtxlWVTg', '7aM2uzoy4tcaELdvGLtsDZ', '68vPrxwgb6ewsQ6BWybnEj', '6xjHl59gsJXF03GgkBcv8e', '27ZZH53psVHr4bRKrVICZ3', '4n5rZpRRb4rzRVRao6gm7a', '4FGF6jhevD51g2g54l6zt8', '5MGCLDGDURTZhg97KyNgUq', '45xF9Aze9EnWu2FEAwqT0E', '6bVMRYDQZlMc9a2YrIsly8', '708gKrtxgCnb2L5qhE20Af', '5hCPFtSkRr5R52NCxIQO4i', '5iYIXyhGscCWk6ztvVjI1A', '5O3BQ3WxGK7tmd0CrwYrE1', '0m5OVHB8GARCA36K8pKgR9', '0KVOsDD049cZWWbq1uxNVk', '2u8NXcZqsEpZ15lPW0ClvH', '6ffzu8r53hRRJdpGyNCvQz', '09MGuL41ZLe9gzuMC4vgXe', '4WIXiJVpULdTIVDtOANKwG', '23AyySApyq5Dixm9367tup', '0KZJ6ZJYKXbd6BoQARMesg', '1kcBFIFeG8lPUV88o4ZNaT', '78RifPofivahDctLwGxh7v', '5Uwaj4i2hnGWAadzS30qxq', '3GOWlA87Hwm3LdhYZYe5jB', '4UuIb3XPkOP1BfQ0QL8imD', '1w0aVYpZ5YFGtoNgKxqTiP', '09d1QWH73sjjyKYc0Mu82I', '5HT9h9cAbv9viqHNPR77sX', '5GMQERVSNWTlhZmYyzwOBs', '4p8nSq1bAIIbhvUtgYTXZm', '1PY0gYjiCbwX6RZi0DsMLA', '1WMEEAXQ4mfzrplOFft7kZ', '5rYur3nFWrbtBwLy8IHZSv', '06RxJMj46buoCSARBCAsSB', '5CJhK3Jl5pcZuetfVRngQd', '57sp216X7QhTDsEF96XjGK', '6HPGaHi7IfWXqHrvXzFcRl', '1fVnmta1rPvcxwdEcL2ixF', '4hyuIfc2PG2BpEqtBpR2yl', '338rbjXJRO4KuEG4vmINW2', '6AW2EpGhPMRuvo397iyP2r', '1kpcbgAjTu9J2mHbiO1vfw', '2xHT7SwVBVQuasDDqzU8EQ', '5atCrwrn8zo69is3zRIM3Z', '7wNcndETbMGceXa81F8TBq', '5HR0lSlfmpljt3BMMBkawJ', '4CmBkPsdbA7ULIVoGC3MfJ', '4qkVBJBifgwWIgvZkZdaUt', '0URVVgGE7nml5poIL1ytge', '5pOgi4TmVOfa0dP6TrRVbl', '5Q9KffxzsfEnpruQVeRSdD', '7AWYwmoGI6j1wwIj5QJGaI', '72bj0Ky0yJYiaD9P2oA1up', '4TgCG8KJgFf3Tiaxo2ClRT', '2h46kmf6QQms2HP9ezz8Rf', '7MAN3OauW7hyy1CmZFMqDL', '2nSu86CgQ68RVUaF0gIvgu', '6hYyiunELXzyWnhqJhpoHW', '3KBveZFn13Nh4A4PKO4ssA', '1YT5fAjwUFG0UGj3MTPLAJ', '5UljV7iP7jvL70uIpXGVZD', '7vAUX4YyY4nOxyGmyvB559', '1ws9Ies6cq6Pol1zZyroKv', '4lWdJtiS7HjltLYvMwAAVG', '720pdK0SRtCaNRSvXykySd', '3GMh4NZ72O8SA7gUsw6DZr', '2M8OpNoJ4uPJdUPZYbyKK7', '03VJ1QqVWMmHvHH7OlSqVp', '3EwyZKjNZpZDEuRbQXh8AQ', '3lJbKB0A7wo8HbtlsQep76', '51fQobmkGirDA5RG9Trnaq', '1gtS2Kuil4CigcaDyrqUn4', '2jOPmnFgueII8c6StKgcNi', '1XEy5hPMYzpjpQ6Ib5GEnM', '5SiMTAUQbLFZr3vOxOHTJS', '4eyx7X9rlKPw9BJLaxmQcU', '2NJJTJWyactyScMD5Pxtk7', '0aUl3IX3eHOJAb5V7iaiHU', '45BjjEP0z5UK0cpP0Dw9x0', '3WXOMMKnVinuI9MTNv3Ke1', '2LxGAqhAjoiSS4awCluZNk', '1AstOp0evEhABe3hmmVlE9', '1FLuswBmoXwuLt7IunW040', '7bRMlPYjKY6NRbBkaLlYGr', '1zZh7yeysOsEZTJ99E9Ced', '220EfzEEOz4MdFmRPWJOUx', '4XUZpNtXX2TcyP6kGawk94', '6MN2b0jsXqlMw6JR0Xx60l', '0vFYOozcJpw0i6GLcgxQiJ', '4UKX72tvv4DFm0zPQWtu0q', '6q0f0zpByDs4Zk0heXZ3cO', '6s7hpnwKcBb7NYrbKsdILL', '2Gj9LSCSvXKNMbyWvPlfEe', '0pYJBfdMHPSY3EbcvETAOg', '6YlpQxlWuxZ7zWR53VSxuF', '4oFZL1rDVWVf2T5gUROuA5', '14dBZzqVarX3MK0Rb3RtSx', '7hpshWnQjC9RmYdMhTkwde', '56WYySIyfHRMWa12yLl2cU', '2mS3VYzVNbBUnc16or6Ww8', '7Hc3iPRHoKRhUzFUgesTxk', '6n87MuRTJHDvtPVPP9cmYT', '3D4fpxF53q5zVc5lwzBUff', '5ELi3OkQXv5jRcE8fG8awu', '1BtAee8Ipceuh5e2Nod2Za', '4KqxGzy64B0UlmMUS28k2Q', '7MK8xFSt1R11lc8PfeXNk6', '4XWmXULAcLHaZR8QiBJJE8', '064FFpAxAVe0FtVx0SDykn', '0V9xgvAW5lwPA3eUhsX358', '4Y8AGDwvUOPs0LmDBENRpi', '5k3tQ3BzKKn0iS3RQT379W', '0ncCZLsnCX5M9HrkEQ3GkN', '76mh0rcSJpNhoCCqazptWm', '3t9eSvoCtf6vKiNUGUomWs', '4NPzTwu2qi5CfkxPXy7fIO', '5QLDBljGslUkRja9odXQlo', '2ypUyChKCn3kk8gUKi4lTe', '5LdKWiOanFSkxKoKir2cXJ', '33zxm6rIBAfPP6Shbb0HKn', '3hy3tOfhZG0KBRFtqZVuAY', '1r83SxiLOdEwuFM6L9bqwG', '2e3w4P6d1RJQIgYwFcsWBR', '0xjz0lbDPCdkXuLZyIRBTo', '05i47oRMs5PexudbRjvNxG', '2edcAWwKM7SQajsFGP0edC', '2vHPaS0Lde3HMNRFiCDaDL', '3MbmDUxmBjLU6ZHC4FFuWE', '5CMougTP1EZ8vct0GF1Yaw', '5qVK1FeNPFt6vEcAJNoIou', '3JIhpuWyyS3uJz6ULnuZEp', '1LFXYXpNHGszRo7AjisPUX', '4uhlnVhc88tx7vsLH5xppX', '5nn907LVCkmkr7TKyX4gPr', '2riuuNLUACGw6OYwXJEXGq', '7s9U025BqOfxyMEL9UcOFb', '4UYBDRsxsFB11Gpr0OGSBj', '1JjiG9eCRGegikIVZZ8qw4', '47f5um52OM7eIuZanumFcM', '2lUk5ygHxGbpHfzrc3uj8N', '36mYk7SwZY7FOemtV5XUGY', '6kNy88k0K3ZVhE7HrqYtHt', '6BncNmlas4wMeR6x2x1zci', '1GemtvqctneTkF62aKJowY', '4UZRjeuXVsXNgYR3sly2FZ', '4rnIDRsSJMIijqGPMc29I5', '6ESd2OIF63fy1WeE8rbAIB', '4pbDrwpQYcaCpAjFTBWSDZ', '3dBwGEX9kwk6ZR7H3zhnu4', '6bppszUyGTZHWOUSbeM8OU', '5wNAHzIKAk0iE9xz33qFew', '0Lp8e39FWpLvIg1QkjuV6x', '4PWKtcP0hKBZrMa9TIVA2A', '1qhhniENQlLrZgBqNPBpHN', '3ozLwZEGdwBIBRrqW8ri05', '18hqsdqWoPSoVPctqZ6DCC', '1bIIX4m3k3BLTnrn1rMuqD', '4GYqayXjsUAc9goKsZMPc9', '1KZi8JlxElT7YudMvzdTxN', '7zatCzGzbIeQjvTs3MMkQu', '7L4axTPuahQaZ5qsEmFM75', '5UmRC0VlUTgzjvM4PPovOT', '3c2aFZVbemPI4Q6kba4IyY', '5CVTQ2vrWEV3NgrqboXEpL', '27KuqtmnYkM08TbscGYQ41', '6vQ9z98sC83AgsDfqbmNnp', '3Oar2JhDLKl132AiE8i0Wu', '2dZvsIQ4CJFuKEPghX9UHh', '31q0es7FeBzUChzAYYN6GN', '0XXzRt3NHkR0HlzWPFvw3Z', '57HLbw5C35P2CjpNJ9ALuS', '4XYEd8S2wKsHUUQz60GbjP', '0uSja7G8VZZ9X0yrMUSSRB', '62CivIx8UXn0cU3DE7eYDy', '1IsnVN9FV5TIJGsyhH4vSU', '6r518e8UcLzVH97FGge0LE', '6UsQFfYKgMYiDD8FGZFNrb', '23qyO9oAkV07BLXDM3jbBd', '47aRYg9zRdm4wbQTCCLsmK', '3gyYkQZkgJ3skbCmseIK7P', '1bNx7Ltr5YSXP0aqBRdxDb', '53RvV6KioUjQuBFNLseks1', '4kJWtxDDNb9oAk3h7sX3N4', '601u4G4T7GKLPAILLZ33Ll', '0whgCxsFPcJF10rDKfABdV', '3KGOY3GEOVmRicM0LXGhDq', '3v2oAQomhOcYCPPHafS3KV', '6N5TNlYhmpuynRBlyXScV4', '2Gkgcu6YruUojn1YMSbXTP', '5Mar6gXhlVAEfCRaNq3KrB', '1CyIxuzynQfa9wVEsX6AwA', '6VM07TmzYJWb4MUEkxRplr', '74fpYY4lCS82Jgqf1DqD3Z', '11QcMpWLKQS3jg44rAKMPm', '5oyNDmNhqh8NP8Y064APEx', '5MhFq0BNOpJLEyIsCYx4cJ', '195NVx05yn1Wy1A0X4jhCg', '0wrllPQeT3DxLSOqaKppOq', '55aVRfutPtCjGyPe7ReFZu', '1gkuqiN10lVQ3yQ51vfILy', '28gqUaAZ7oPBynrJAG44h2', '1SOfxwVz2KBMzatpfTHqIR', '4LIkAnWdSlJzcGilu9QfzG', '66cffJ6QfTyAQRMBdvQmgw', '6NPwD4KlVgqQOduG2KVPRF', '73NJ1URlrowfkuZ8nPNEsb', '3CZTsW4u9mF6PaiVO4vSsi', '7G4BWYi9cWu9gM8ww8d6Gp', '3AFbgweDTMnc88WRcQOUKF', '6BPzcgyrMokYa4IxMGCNOO', '7gPMGMW3Cns1cEQHrUyZ6v', '2WacWCmXrJV8ppig9xhiDo', '7JWDQddwgJP4yU5KALU9rD', '5Q26WSnPlhDN5ZJcYZQywE', '3cgiN6fgrWWyKMGr4ZZ77r', '07DpNGQcpfyownq9E3Ix9Z', '4fOC1oefc9aoHYctI6tbcV', '19PZZVtIgXIXt4pJ56UBvI', '1QJR6rRhsZVdmHjB052CSS', '7pe7JWmS5Ek4pOiKcSU25H', '021gjtd0a3NrmOwtzogTPR', '5KwpWZxOUmXnpFddmQqxZG', '5Xmi7QP7vJnybihS4GB8xK', '32opqQnFH9WJlX0koTSk0k', '1edRKKXtGAKIi973RLeYwa', '6Xt4ccmK1SZKBrd7VYSClg', '0DyFdO9zKqWBpys2YYk17Y', '0PTYpNmhyLx3OrxV7s9xep', '2MWGRiORO4AenR4x2AenS3', '0P6WrsKYBNPmD48VPWOCWZ', '3daEK2NXORCT028qFb3B64', '7GaEB6uDIJCbDbT2vsaSUr', '5O6QvIrWnv6WnFZH9B9Yds', '2K4cyGqJ1klZEGF689y75P', '6N4VCXzx14gFPFY6pklEbV', '4WZa71jH7z2wuZGkqe4rh5', '14kekCCzelIMsWqyxeWRkY', '41jNOZhgRmYihyg85yqqIz', '07NoQ1asGjHGjf7b7r8hLI', '3xmoHIxtevI5alCzUHy5Se', '6goISm8AnCkw2xcNqVF9Nn', '5oUYyO4uhAdHD5a4SCH9ta', '2rckQ2MuoZlG2uz4bBbSvU', '3C35LTtgD6M6wHpwM50jS4', '2IyM6emf0xVft6HyQfa2Ey', '5LELgZUqPCCBxvwER9cpui', '5E8cYKxykxApJ9p7UzNGd0', '7aCd2uFGS9Z7TnC64bIgqq', '2Nrhy89l7QecW7c01D9Vn1', '3kf2jk93CqIa86bC9FxpOG', '1BwhJOeORQJIv6s69eoh5D', '4Durhivi80aUUq9gFyHWzG', '7iMqWZnU8YcwsU2HqcpBBD', '2sX5p9m3EOHj0h5ZSNRemB', '1bxtePWzYybaPiUZqvgQVf', '4MnCIuOVkhshEkNUNgt6xE', '5DMjRVFtZG3vDOGXJSplpm', '67ngkQ7etkfrks35IVzxbZ', '0P7UFTJUB4pMtlXjIqRl4S', '5CKAVRV6J8sWQBCmnYICZD', '1z4qdv4XxmPdpVj0D6hPdM', '4jW0JslSUaV94CUPeCGlM8', '7okWVxsFpSn99C3562wHmo', '3LjuF24cWEq40QDJ1P5Jbl', '7xeWOxCCT5Tv2nupd6u2hC', '27I4tGbU4BZvq09kOpT0k4', '6Yo4qTQgqCN1WXcCmQx7Q4', '6L4UVYidPdd3id0H2sVeno', '4zBTq9VPsaQE8rs4C9sbVZ', '2ULvNGqqm0ZFFjB2T0AUjZ', '7a2AEXko9bWrixa5yKJXNH', '2iS5us96UxLtV2gC1BDKUV', '1p6jo8K3Jyd0TmFc6S6Yh1', '3aS5reOG1d7b49WCY2Hhg2', '1YbTtC4GfBNgQfKIKVhPw3', '6RHRZQyyQIb901O931JTS7', '4R2a6E4fYpi1kjp6eQuuKE', '1U9bcPXjeE9xEbONC67Zja', '3MZn5KmUMFz31N2HalT6yz', '2POevSnaNhIuw3soSIrB5a', '1YXUD5D1ZRSaKZRZME4UB5', '2isCFbEg9Omhbykb4ejrjz', '3rNpn0KntQJEncVlLImY9j', '7yzNpXnAFfqFkeOuEF3CUV', '5iRadJ6pnACMhU9FhQWnLO', '6SDy0CHEvHB591MeizBrqY', '6FyRffDfn46hL8DWbm676O', '302M7irT5jEM3xh2bhojdv', '6VK9AipqyvmxYs816omoc0', '3FhTuMoM8Zw5s2tUUzin1R', '0CECbcanOoDprkHvuutPN4', '5NJmMabxzUI1URHIFNhpbG', '0RMRppBQhVoVeKxxBGCoTL', '4EadWyYfZySdFNLvIE8lRa', '1bAHNj6NQQqbRmnlWyOQvC', '4sJadYMwZYqTbTiJDCp5KV', '2JyGSCWeruwFHK6w57N1qG', '0iorx8V2QJtwYpDzEGcnr2', '4WTFpSaKiB6s15HZSlPQNS', '2IzU1yGWWCrBXpInWmjJr5', '6ivllKQUfyCkr7ePHTVNxq', '1heFfoLp6clLgTwis8BXR1', '0Z3rdQVi4RdqOI1KMyh5M8', '3ICChM5ebH2RPZnvXg4uuC', '6E4bO2jUvePa4xl1IMvnS1', '34PgbZHudjUapNEqsb1WcW', '1p4swnLCXRBeGzu2iHkiG9', '2y5bhecj9eEXy9IzMVdiud', '0QUisLy93hoe0GYSUOVTzE', '5IMQMzhrhF1TuXLSEr7Gku', '5RScucFoUuNzhLWwGWy05b', '6sKkOdYUTTOgYWWcqDw9ED', '0J1OzJsuiJfueQO6opksI4', '4j3aDnax50wYA8p8fDJLCF', '2jx4gzu1Z2bgvCUWtC86Q9', '2hsMpYbHOVmYShhvOA6Q13', '2H7y1IG7mcWOqnw4mzvaPr', '5K7EXhEFrzNt9ovegrIcHW', '44DRt5JbAtRrt5vxH1lazp', '4lGFSfsqSSP37WWzi8gIdV', '2vJ787fhoT1V8ryysmhioO', '1rGPOtHSe8e4Qp7v44M3nd', '5EZnkKNbuL9vKPOgDC4AJa', '0fCXNRIXLKGqH8186vaoOD', '0Oy39XZnlEJ4wyB9zcuFmr', '1Dyvne4MdeiQ75teY5m7jg', '6RatW0PqTXPfesloHFDaNi', '6aTVxHerihREeq91z1Cb7u', '7JC6zMu1rxLEEcY4anx4QA', '2JVxSp8JWtJ2mSR4j80oRS', '7xh57GQyRNbLLgOnLpiZPS', '3SofrfhMxxG5TkD9uo0fe7', '2NXgCETSP6neHpo6PQaDvj', '7qPdQj8fmjU4xJbqdYYTU5', '7ckofk3m63RHNs9wiIl5LT', '4VLmSzYRVIrrGDx3cFT827', '1Da5kabhTEe6dT3FxRlgk4', '1qy14jAIoVcZHIP34anyxm', '2LZYXxOavdK5DlmICcgSRB', '4Qme2qmSqORtRRM9hTC5hH', '3rnKQLY037DIoNMzlgvC3j', '0neva1N08tpWLLVrrXZm2Y', '7tU5JvCfG0t3PHG7mchPjv', '2rHgv0NthKxey7CqpqwxXS', '5NKZ7YCyoXmQUTMeEhST0t', '2puJRo8uTCdER0MUyXGFsb'];


    const randomIndex = Math.floor(Math.random() * countryCodes.length);
    const countryCode = countryCodes[randomIndex];
    const countryName = countryNames[randomIndex];

    const genreIndex = Math.floor(Math.random() * genres.length);
    const genre = genres[genreIndex];

    const artistIndex = Math.floor(Math.random() * top1000artist.length)
    const artist = top1000artist[artistIndex];

    return { countryCode, countryName, genre, artist };
}

// get the country of origin from the track Spotify uri
async function getRandomCountryRec() {
    try {

        const accessToken = localStorage.getItem("accessToken");
        const { countryCode, countryName, genre, artist } = await getOneCountryCodeAndGenre();

        document.getElementById("countryInfo")!.innerText = "Country: " + countryName;

        const response = await fetch("https://api.spotify.com/v1/recommendations?limit=1&market=" + countryCode + "&seed_genres=" + genre + "&seed_artists=" + artist, {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const urlLink = data.tracks[0].external_urls.spotify;
        const songLink = data.tracks[0].id;
        const songName = data.tracks[0].name;

        // have the link to the recommended song
        document.getElementById("link")!.setAttribute('href', urlLink);
        document.getElementById("recName")!.innerHTML = "Recommendation: " + songName;

        console.log("rec data: ", data);

        // add the song to the queue
        if (accessToken != null) {
            await addSongToQueue(accessToken, songLink);
            await skipToNext(accessToken);
        } else {
            console.error("no access token");
        }

    } catch (error) {
        console.error("Error obtaining rec: ", error);
    }
}

// skip to next track
async function skipToNext(accessToken: string) {

    await fetch("https://api.spotify.com/v1/me/player/next", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` }
    });
}

// add the newly recommended song to queue
async function addSongToQueue(accessToken: string, songLink: string) {

    const response = await fetch("https://api.spotify.com/v1/me/player/queue?uri=spotify%3Atrack%3A" + songLink, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

// get if playing or not
async function getPlayingStatus(accessToken: string): Promise<boolean | null> {
    try {

        const response = await fetch("https://api.spotify.com/v1/me/player", {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            if (response.status === 204) {
                // No content, which means no active device
                console.log("no active device");
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // get the song being played and artist and show them
        document.getElementById("songName")!.innerText = "Song: " + data.item.name + " by " + data.item.artists[0].name;

        console.log("playing status: ", data);
        return data.is_playing ?? null;
    } catch (error) {
        console.error("Error fetching playing status: ", error);
        return null;
    }
}

async function pausePlaying(accessToken: string) {
    try {
        // create params for API request
        const params = new URLSearchParams();
        params.append("client_id", clientId);
        params.append("scope", "user-modify-playback-state");

        await fetch("https://api.spotify.com/v1/me/player/pause", {
            method: "PUT",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: params
        });

    } catch (error) {
        console.error("Error pausing playing: ", error);
        return null;
    }
}

async function playPlaying(accessToken: string) {
    try {
        // create params for API request
        const params = new URLSearchParams();
        params.append("client_id", clientId);
        params.append("scope", "user-modify-playback-state");

        await fetch("https://api.spotify.com/v1/me/player/play", {
            method: "PUT",
            headers: { Authorization: `Bearer ${accessToken}` }
        });
    } catch (error) {
        console.error("Error playing: ", error);
        return null;
    }
}

document.getElementById("togglePlay")!.onclick = () => togglePlaying();
document.getElementById("randRec")!.onclick = () => getRandomCountryRec();

doThings();