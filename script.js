// ==========================================
// 1. DATA & SETUP (Debug Mode)

// ==========================================

const fifaCountryCodes = {
  "Mexico": "MEX",
  "South Africa": "RSA", // I added a space here to be safe
  "South Korea": "KOR",  // Added space
  "Canada": "CAN",
  "Qatar": "QAT",
  "Switzerland": "SUI",
  "USA": "USA",
  "Morocco": "MAR",
  "Haiti": "HAI",
  "Scotland": "SCO",
  "Brazil": "BRA",
  "Paraguay": "PAR",
  "Australia": "AUS",
  "Germany": "GER",
  "Curacao": "CUW",
  "Ivory Coast": "CIV", // Added space
  "Ecuador": "ECU",
  "Netherlands": "NED",
  "Japan": "JPN",
  "Tunisia": "TUN",
  "Belgium": "BEL",
  "Egypt": "EGY",
  "Iran": "IRN",
  "New Zealand": "NZL", // Added space
  "Spain": "ESP",
  "Cape Verde": "CPV", // Added space
  "Saudi Arabia": "KSA", // Added space
  "Uruguay": "URU",
  "France": "FRA",
  "Senegal": "SEN",
  "Norway": "NOR",
  "Argentina": "ARG",
  "Algeria": "ALG",
  "Austria": "AUT",
  "Jordan": "JOR",
  "Portugal": "POR",
  "Uzbekistan": "UZB",
  "Colombia": "COL",
  "England": "ENG",
  "Croatia": "CRO",
  "Ghana": "GHA",
  "Panama": "PAN",
  "Denmark": "DEN"
  // Add any missing ones...
};

// Map Team Name -> FlagCDN Code (ISO alpha-2)
const teamCodes = {
    // --- CONCACAF (North America) ---
    "USA": "us", "Canada": "ca", "Mexico": "mx",
    "Costa Rica": "cr", "Panama": "pa", "Jamaica": "jm", 
    "Honduras": "hn", "El Salvador": "sv",
    "Haiti": "ht",

    // --- CONMEBOL (South America) ---
    "Argentina": "ar", "Brazil": "br", "Uruguay": "uy",
    "Colombia": "co", "Ecuador": "ec", "Chile": "cl",
    "Peru": "pe", "Paraguay": "py", "Venezuela": "ve",

    // --- UEFA (Europe) ---
    "France": "fr", "Germany": "de", "Spain": "es",
    "England": "gb-eng", "Portugal": "pt", "Netherlands": "nl",
    "Belgium": "be", "Italy": "it", "Croatia": "hr",
    "Denmark": "dk", "Switzerland": "ch", "Serbia": "rs",
    "Poland": "pl", "Ukraine": "ua", "Sweden": "se",
    "Turkey": "tr", "Wales": "gb-wls", "Scotland": "gb-sct",
    "Austria": "at", "Hungary": "hu", "Czech Republic": "cz",
    "Norway": "no",

    // --- CAF (Africa) ---
    "Morocco": "ma", "Senegal": "sn", "Nigeria": "ng",
    "Egypt": "eg", "Tunisia": "tn", "Algeria": "dz",
    "Cameroon": "cm", "Ghana": "gh", "Ivory Coast": "ci",
    "Mali": "ml", "Burkina Faso": "bf",
    "Cape Verde": "cv",
    "South Africa": "za",

    // --- AFC (Asia) ---
    "Japan": "jp", "South Korea": "kr", "Iran": "ir",
    "Australia": "au", "Saudi Arabia": "sa", "Qatar": "qa",
    "Iraq": "iq", "UAE": "ae", "Uzbekistan": "uz",
    "China": "cn",
    "Jordan": "jo",

    // --- OFC (Oceania) ---
    "New Zealand": "nz", "Fiji": "fj",
    "Curacao": "cw",

    // --- Fallbacks / Generic ---
    "TBD": "un", // United Nations flag for unknown
};

let teamOriginMap = {};

const groupsData = {
  A: ['Mexico', 'South Africa', 'South Korea', 'PLD'],
  B: ['Canada', 'PLA', 'Qatar', 'Switzerland'],
  C: ['USA', 'Morocco', 'Haiti', 'Scotland'],
  D: ['Brazil', 'Paraguay', 'Australia', 'PLC'],
  E: ['Germany', 'Curacao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'PLB', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'PL2', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'PL1', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
};

const groupsContainer = document.getElementById('groups-container');
let finalGroupStandings = {}; 
let fifaOfficialTable = null; 
let bracketState = {}; 

window.onpopstate = function(event) {
    if (event.state) showScreen(event.state.screen);
    else showScreen('groups');
};

// ==========================================
// 2. PHASE 1 & 2 (Standard Logic)
// ==========================================

// Helper function to generate the image HTML (make sure this is in your script too)
function getFlagHtml(teamName) {
    // If name isn't found, try to find a partial match or default to 'un'
    const code = teamCodes[teamName] || 'un'; 
    return `<img src="https://flagcdn.com/w40/${code}.png" 
            srcset="https://flagcdn.com/w80/${code}.png 2x" 
            width="24" height="16" 
            alt="${teamName}" 
            class="inline-block mr-1 rounded shadow-sm border border-gray-100">`;
}

function init() {
    loadFifaTable();
    history.replaceState({screen: 'groups'}, null, "");

    for (const [groupName, teams] of Object.entries(groupsData)) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow p-3 border border-gray-200';
        card.innerHTML = `<h3 class="font-bold text-lg mb-2 text-center text-blue-800">Group ${groupName}</h3>`;
        const list = document.createElement('ul');
        list.className = 'space-y-2'; 
        list.dataset.group = groupName;
        teams.forEach(team => {
            const li = document.createElement('li');
            //Use innerHTML to render the flag image + text
            li.innerHTML = `${getFlagHtml(team)} <span>${team}</span>`;
            li.className = 'p-3 bg-gray-50 rounded cursor-move hover:bg-gray-100 select-none shadow-sm font-medium transition-colors border-l-8 flex items-center'; // Added 'flex items-center'
            list.appendChild(li);
        });
        card.appendChild(list);
        groupsContainer.appendChild(card);
        new Sortable(list, { animation: 150, ghostClass: 'bg-blue-100', onEnd: () => updateVisuals(list) });
        updateVisuals(list); 
    }
}

// --- YOUR JSON LOADER ---
async function loadFifaTable() {
    try {
        const response = await fetch('fifa_table.json');
        if (!response.ok) throw new Error("File not found");
        fifaOfficialTable = await response.json();
        console.log("JSON Table Loaded.");
    } catch (error) {
        // Red error if JSON fails
        document.body.innerHTML = `
            <div style="background:red; color:white; padding:40px; font-family:sans-serif;">
                <h1>CRITICAL ERROR</h1>
                <p>Could not load <strong>fifa_table.json</strong>.</p>
                <p>Ensure you are using <strong>Live Server</strong>.</p>
            </div>`;
    }
}

function updateVisuals(list) {
    const items = list.children;
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('opacity-50');
        if (i <= 1) items[i].style.borderColor = '#22c55e';
        else if (i === 2) items[i].style.borderColor = '#eab308';
        else { items[i].style.borderColor = '#d1d5db'; items[i].classList.add('opacity-50'); }
    }
}

function goToThirdPlacePhase() {
    document.querySelectorAll('#groups-container ul').forEach(list => {
        finalGroupStandings[list.dataset.group] = Array.from(list.children).map(li => {
            // FIX: Select the specific span containing the name to avoid grabbing images/extra text
            return li.querySelector('span').textContent.trim(); 
        });
    });

    const thirdList = document.getElementById('third-place-list');
    thirdList.innerHTML = ''; 
    Object.keys(finalGroupStandings).forEach(group => {
        const teamName = finalGroupStandings[group][2]; 
        // Inside goToThirdPlacePhase():
        const li = document.createElement('li');
        // CHANGE: Insert getFlagHtml(teamName) before the name
        li.innerHTML = `
            <span class="font-bold text-gray-400 w-8">${group}</span> 
            <div class="flex items-center">
                ${getFlagHtml(teamName)}
                <span class="font-bold text-lg ml-2">${teamName}</span>
            </div>
        `;
        li.dataset.originGroup = group; 
        li.className = 'p-4 bg-white border-b border-gray-100 flex items-center cursor-move hover:bg-gray-50 border-l-8 transition-all';
        thirdList.appendChild(li);
    });

    new Sortable(thirdList, { animation: 150, ghostClass: 'bg-gray-100', onEnd: () => updateThirdPlaceVisuals() });
    updateThirdPlaceVisuals();
    history.pushState({screen: 'third-place'}, null, "#third-place");
    showScreen('third-place');
}

function updateThirdPlaceVisuals() {
    const items = document.getElementById('third-place-list').children;
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('opacity-50');
        if (i < 8) items[i].style.borderColor = '#22c55e';
        else { items[i].style.borderColor = '#ef4444'; items[i].classList.add('opacity-50'); }
    }
}

// ==========================================
// 3. PHASE 3: SPLIT BRACKET ENGINE
// ==========================================
function startKnockouts() {
    const thirdListItems = document.getElementById('third-place-list').children;
    let qualifiedThirdsGroups = [];
    for(let i=0; i<8; i++) qualifiedThirdsGroups.push(thirdListItems[i].dataset.originGroup);
    qualifiedThirdsGroups.sort();

    // --- NEW LOGIC STARTS HERE ---
    teamOriginMap = {}; // Reset map
    
    // finalGroupStandings contains the order YOU dragged the teams into
    for (const [group, teams] of Object.entries(finalGroupStandings)) {
        // teams[0] is the team at the top of the list -> "A1"
        teamOriginMap[teams[0]] = `${group}1`; 
        
        // teams[1] is the team second in the list -> "A2"
        teamOriginMap[teams[1]] = `${group}2`; 
        
        // teams[2] is the team third in the list -> "A3"
        teamOriginMap[teams[2]] = `${group}3`; 
    }
    // --- NEW LOGIC ENDS HERE ---

    const r32Matches = calculateKnockoutMatchups(finalGroupStandings, qualifiedThirdsGroups);
    initializeBracketState(r32Matches);
    renderBracket();

    history.pushState({screen: 'bracket'}, null, "#bracket");
    showScreen('bracket');
}

function initializeBracketState(r32Matches) {
    bracketState = {};
    // R32
    for (let id = 73; id <= 88; id++) {
        bracketState[id] = { id: id, home: r32Matches[id].home, away: r32Matches[id].away, winner: null, nextMatchId: getNextMatchId(id), nextSlot: getNextMatchSlot(id) };
    }
    // Future Rounds
    for (let id = 89; id <= 104; id++) {
        bracketState[id] = { id: id, home: 'TBD', away: 'TBD', winner: null, nextMatchId: id === 104 ? null : getNextMatchId(id), nextSlot: id === 104 ? null : getNextMatchSlot(id) };
    }
}

// Math logic: Maps matches to next round
function getNextMatchId(id) {
    if (id >= 73 && id <= 88) return 89 + Math.floor((id - 73) / 2); // R32->R16
    if (id >= 89 && id <= 96) return 97 + Math.floor((id - 89) / 2); // R16->QF
    if (id >= 97 && id <= 100) return 101 + Math.floor((id - 97) / 2); // QF->SF
    if (id >= 101 && id <= 102) return 104; // SF->Final
    return null;
}

function getNextMatchSlot(id) {
    return (id % 2 !== 0) ? 'home' : 'away';
}

//
function renderBracket() {
    const leftContainer = document.getElementById('bracket-left');
    const rightContainer = document.getElementById('bracket-right');
    const finalContainer = document.getElementById('bracket-final');
    
    // 1. Clear previous content
    leftContainer.innerHTML = '';
    rightContainer.innerHTML = '';
    finalContainer.innerHTML = '';

    // 2. Define Rounds
    const leftRounds = [
        { name: "Round of 32", ids: [73, 74, 75, 76, 77, 78, 79, 80] },
        { name: "Round of 16", ids: [89, 90, 91, 92] },
        { name: "Quarter Finals", ids: [97, 98] },
        { name: "Semi Finals", ids: [101] }
    ];

    const rightRounds = [
        { name: "Round of 32", ids: [81, 82, 83, 84, 85, 86, 87, 88] },
        { name: "Round of 16", ids: [93, 94, 95, 96] },
        { name: "Quarter Finals", ids: [99, 100] },
        { name: "Semi Finals", ids: [102] }
    ];

    // 3. Render Sides
    renderSide(leftContainer, leftRounds);
    renderSide(rightContainer, rightRounds);

    // 4. Render Final (Lifted slightly above center)
    // ADDED: 'pb-32' (Padding Bottom). This pushes the "center" point upwards.
    // You can adjust 'pb-32' to 'pb-20' (lower) or 'pb-40' (higher) to taste.
    finalContainer.className = "flex flex-col items-center self-stretch w-32 z-10 pb-64";
    
    // 5. Wrapper
    const finalWrapper = document.createElement('div');
    finalWrapper.className = "my-auto flex flex-col items-center w-full";

    const finalTitle = document.createElement('h3');
    finalTitle.className = "text-center font-bold text-yellow-600 mb-4 uppercase tracking-widest text-sm";
    finalTitle.innerText = "FINAL";
    finalWrapper.appendChild(finalTitle);

    finalWrapper.appendChild(createMatchCard(bracketState[104]));
    
    finalContainer.appendChild(finalWrapper);

    // 6. Draw Lines
    setTimeout(drawLines, 0);
}


//
function renderSide(container, rounds) {
    rounds.forEach((round) => {
        // 1. Column Container
        // w-32 (fixed width)
        // h-full (forces it to match the height of the tallest neighbor)
        const col = document.createElement('div');
        col.className = `flex flex-col w-32 h-full flex-none relative`; 
        
        // 2. Title (Pinned to the top)
        const title = document.createElement('h3');
        title.className = "text-center font-bold text-gray-400 mb-2 uppercase tracking-widest text-[10px] h-4 flex-none";
        title.innerText = round.name;
        col.appendChild(title);

        // 3. Matches Container
        // flex-1: Takes up all remaining vertical space
        // justify-around: The MAGIC. It evenly spaces the matches vertically.
        const matchesDiv = document.createElement('div');
        matchesDiv.className = "flex flex-col flex-1 justify-around w-full"; 
        
        round.ids.forEach(id => {
            matchesDiv.appendChild(createMatchCard(bracketState[id]));
        });
        
        col.appendChild(matchesDiv);
        container.appendChild(col);
    });
}

function createMatchCard(match) {
    const div = document.createElement('div');
    div.id = `match-${match.id}`;
    div.className = 'bg-white border-2 border-gray-300 rounded-lg shadow-sm flex flex-col relative overflow-hidden transition-all z-20 w-full'; 
    
    if (match.home !== 'TBD' && match.away !== 'TBD' && !match.winner) {
        div.classList.add('border-blue-400', 'shadow-md');
    }

    // FIFA CODE LOOKUP: Use the 3-letter code for the display name
    const homeDisplayName = fifaCountryCodes[match.home] || match.home;
    const awayDisplayName = fifaCountryCodes[match.away] || match.away;

    const homeBtn = document.createElement('button');
    homeBtn.className = `p-3 text-left font-bold border-b border-gray-200 text-sm transition-colors flex items-center ${getBtnColor(match, match.home)}`;
    homeBtn.innerHTML = `
        ${getFlagHtml(match.home)} 
        <div class="truncate">
            <span>${homeDisplayName}</span> 
            ${teamOriginMap[match.home] ? `<span class="text-xs font-normal opacity-70">(${teamOriginMap[match.home]})</span>` : ''}
        </div>`; 
    homeBtn.onclick = () => onMatchClick(match.id, 'home');
    
    const awayBtn = document.createElement('button');
    awayBtn.className = `p-3 text-left font-bold text-sm transition-colors flex items-center ${getBtnColor(match, match.away)}`;
    awayBtn.innerHTML = `
        ${getFlagHtml(match.away)} 
        <div class="truncate">
            <span>${awayDisplayName}</span> 
            ${teamOriginMap[match.away] ? `<span class="text-xs font-normal opacity-70">(${teamOriginMap[match.away]})</span>` : ''}
        </div>`;
    awayBtn.onclick = () => onMatchClick(match.id, 'away');

    div.appendChild(homeBtn);
    div.appendChild(awayBtn);
    return div;
}

function drawLines() {
    const svg = document.getElementById('bracket-lines');
    if (!svg) return;
    svg.innerHTML = ''; // Clear old lines

    Object.values(bracketState).forEach(match => {
        // If there is no next match (e.g. the Final), don't draw a line
        if (!match.nextMatchId) return;

        const startEl = document.getElementById(`match-${match.id}`);
        const endEl = document.getElementById(`match-${match.nextMatchId}`);

        if (startEl && endEl) {
            const startRect = startEl.getBoundingClientRect();
            const endRect = endEl.getBoundingClientRect();
            const containerRect = svg.getBoundingClientRect();

            // Determine direction based on screen position
            // If Start is to the left of End, we are on the LEFT bracket.
            const isLeftBracket = startRect.left < endRect.left;

            let x1, y1, x2, y2;

            if (isLeftBracket) {
                // LEFT SIDE: Connect Right edge of Start -> Left edge of End
                x1 = startRect.right - containerRect.left;
                y1 = startRect.top + (startRect.height / 2) - containerRect.top;
                x2 = endRect.left - containerRect.left;
                y2 = endRect.top + (endRect.height / 2) - containerRect.top;
            } else {
                // RIGHT SIDE: Connect Left edge of Start -> Right edge of End
                x1 = startRect.left - containerRect.left;
                y1 = startRect.top + (startRect.height / 2) - containerRect.top;
                x2 = endRect.right - containerRect.left;
                y2 = endRect.top + (endRect.height / 2) - containerRect.top;
            }

            // Draw the path
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            
            // Calculate midpoint for the "dog-leg" bend
            const midX = x1 + (x2 - x1) / 2;

            // Path logic: Move to Start -> Line to Mid -> Line to Height -> Line to End
            const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

            path.setAttribute("d", d);
            path.setAttribute("stroke", "#cbd5e1"); // Light gray color (slate-300)
            path.setAttribute("stroke-width", "2");
            path.setAttribute("fill", "none");

            svg.appendChild(path);
        }
    });
}

function getBtnColor(match, teamName) {
    if (teamName === 'TBD') return 'text-gray-300 pointer-events-none bg-gray-50';
    
    // If this team is the winner
    if (match.winner === teamName) {
        // SPECIAL CHECK: Is this the Final Match (ID 104)?
        if (match.id === 104) {
            // Use Gold/Amber background, dark text for contrast, and maybe a glow ring
            return 'bg-amber-400 text-blue-900 font-black shadow-lg ring-2 ring-yellow-200';
        }
        // All other rounds stay Green
        return 'bg-green-600 text-white';
    }

    if (match.winner && match.winner !== teamName) return 'bg-gray-100 text-gray-400 line-through decoration-2 decoration-gray-300'; 
    return 'hover:bg-blue-50 text-gray-800'; 
}

function onMatchClick(matchId, side) {
    const match = bracketState[matchId];
    const winnerName = side === 'home' ? match.home : match.away;
    if (winnerName === 'TBD') return;

    match.winner = winnerName;

    if (match.nextMatchId) {
        const nextMatch = bracketState[match.nextMatchId];
        if (match.nextSlot === 'home') nextMatch.home = winnerName;
        else nextMatch.away = winnerName;
        
        // Reset future chain
        nextMatch.winner = null; 
        if(nextMatch.nextMatchId) {
             const futureMatch = bracketState[nextMatch.nextMatchId];
             if(nextMatch.nextSlot === 'home') futureMatch.home = 'TBD';
             else futureMatch.away = 'TBD';
             futureMatch.winner = null;
        }
    } else {
        //showChampion(winnerName);
    }
    renderBracket();
}

function showChampion(name) {
    document.getElementById('champion-name').innerText = name;
    document.getElementById('champion-display').classList.remove('hidden');
}
function closeChampion() { document.getElementById('champion-display').classList.add('hidden'); }

// ==========================================
// 4. LOGIC ENGINE
// ==========================================
function calculateKnockoutMatchups(groupResults, bestThirdPlaceGroups) {
    const matches = {
        73: { home: groupResults['A'][1], away: groupResults['B'][1] },
        75: { home: groupResults['F'][0], away: groupResults['C'][1] },
        76: { home: groupResults['C'][0], away: groupResults['F'][1] },
        78: { home: groupResults['E'][1], away: groupResults['I'][1] },
        83: { home: groupResults['K'][1], away: groupResults['L'][1] },
        84: { home: groupResults['H'][0], away: groupResults['J'][1] },
        86: { home: groupResults['J'][0], away: groupResults['H'][1] },
        88: { home: groupResults['D'][1], away: groupResults['G'][1] }
    };

    const comboKey = bestThirdPlaceGroups.join('');
    let assignment = {};
    
    // JSON LOOKUP with Strict Error Checking
    if (fifaOfficialTable && fifaOfficialTable[comboKey]) {
        assignment = fifaOfficialTable[comboKey];
    } else {
        alert("Error: Combination " + comboKey + " not found in JSON (or JSON not loaded).");
        return {};
    }

    matches[74] = { home: groupResults['E'][0], away: getTeam(assignment['E'], groupResults) };
    matches[77] = { home: groupResults['I'][0], away: getTeam(assignment['I'], groupResults) };
    matches[79] = { home: groupResults['A'][0], away: getTeam(assignment['A'], groupResults) };
    matches[80] = { home: groupResults['L'][0], away: getTeam(assignment['L'], groupResults) };
    matches[81] = { home: groupResults['D'][0], away: getTeam(assignment['D'], groupResults) };
    matches[82] = { home: groupResults['G'][0], away: getTeam(assignment['G'], groupResults) };
    matches[85] = { home: groupResults['B'][0], away: getTeam(assignment['B'], groupResults) };
    matches[87] = { home: groupResults['K'][0], away: getTeam(assignment['K'], groupResults) };

    return matches;
}

function getTeam(groupLetter, groupResults) {
    if(!groupLetter || !groupResults[groupLetter]) return "TBD";
    return groupResults[groupLetter][2];
}

function showScreen(screenName) {
    // 1. Select all the phase elements
    const p1 = document.getElementById('groups-container');
    const p1Btn = document.getElementById('phase1-controls');
    const p1Instr = document.getElementById('phase1-instructions'); // <--- NEW SELECTION
    
    const p2 = document.getElementById('third-place-container');
    const p3 = document.getElementById('bracket-container');

    // 2. Hide EVERYTHING first
    p1.classList.add('hidden'); 
    p1Btn.classList.add('hidden');
    p1Instr.classList.add('hidden'); // <--- NEW HIDE
    p2.classList.add('hidden'); 
    p3.classList.add('hidden');

    // 3. Update the top indicator text (Optional polish)
    const indicator = document.getElementById('phase-indicator');

    // 4. Show only the active screen
    if (screenName === 'groups') {
        p1.classList.remove('hidden'); 
        p1Btn.classList.remove('hidden');
        p1Instr.classList.remove('hidden'); // <--- NEW SHOW
        if(indicator) indicator.innerText = "Group Stage";
        
    } else if (screenName === 'third-place') {
        p2.classList.remove('hidden');
        if(indicator) indicator.innerText = "Ranking 3rd Place";

    } else if (screenName === 'bracket') {
        p3.classList.remove('hidden');
        if(indicator) indicator.innerText = "Knockout Bracket";
    }
}

function goBack() { window.history.back(); }

init();

// OPTIONAL: Add this line at the very bottom of the file so lines redraw if you resize the window
window.addEventListener('resize', drawLines);