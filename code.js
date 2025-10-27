// Global storage for loaded data
let fighterData = null;
let abilityData = null;

// Load both JSON files and store them for use
async function loadData() {
    try {
        // Load fighters data
        const fightersResponse = await fetch('./fighters.json');
        if (!fightersResponse.ok) throw new Error(`HTTP error! status: ${fightersResponse.status}`);
        fighterData = await fightersResponse.json();
        
        // Load abilities data
        const abilitiesResponse = await fetch('./abilities.json');
        if (!abilitiesResponse.ok) throw new Error(`HTTP error! status: ${abilitiesResponse.status}`);
        abilityData = await abilitiesResponse.json();
        
        console.log(`Loaded ${fighterData.length} fighters and ${abilityData.length} abilities`);
        return true;
    } catch (error) {
        console.error('Error loading data:', error);
        return false;
    }
}
 
 function parseWarcryClipboard(clipboardText) {
    const lines = clipboardText.trim().split('\n');
    
    // Find the actual content (skip dashes and "Generated on" line)
    const contentLines = lines.filter(line => 
        !line.startsWith('```') &&
        !line.includes('---') && 
        !line.includes('Generated on')
    ).map(line => line.trim()).filter(line => line);
    
    // Extract warband name (first line, remove quotes)
    const warbandName = contentLines[0].replace(/"/g, '');
    
    // Extract faction (second line)
    const faction = contentLines[1];
    
    // Extract points info (third line)
    const pointsLine = contentLines[2];
    const pointsMatch = pointsLine.match(/(\d+)pts/);
    const fightersMatch = pointsLine.match(/(\d+) fighters/);
    const totalPoints = pointsMatch ? parseInt(pointsMatch[1]) : 0;
    const fighterCount = fightersMatch ? parseInt(fightersMatch[1]) : 0;
    
    // Extract fighters (lines starting with "- ")
    const fighters = [];
    for (let i = 3; i < contentLines.length; i++) {
        const line = contentLines[i];
        if (line.startsWith('- ')) {
            // Parse fighter line
            const fighterText = line.substring(2); // Remove "- "
            
            // Extract name and points
            const pointsMatch = fighterText.match(/\((\d+)pts/);
            const points = pointsMatch ? parseInt(pointsMatch[1]) : 0;
            
            // Extract name (everything before the points)
            const nameMatch = fighterText.match(/^(.+?)\s*\(/);
            const name = nameMatch ? nameMatch[1].trim() : fighterText;
            
            // Check if hero
            const isHero = fighterText.includes('Hero');
            
            fighters.push({
                name: name,
                points: points,
                isHero: isHero,
            });
        }
    }
    
    return {
        warbandName: warbandName,
        faction: faction,
        totalPoints: totalPoints,
        fighterCount: fighterCount,
        fighters: fighters
    };
}
// This function mateches fighters from the parsed list to the fighters.json database
function matchFighters(Fighterlist, fighterData) {
    let fightersData = fighterData;
        // Create a new list with matching entries
    const matchedFighters = Fighterlist.map(fighter => {
       return fightersData.find(f => f.name === fighter.name) || null;
    }).filter(f => f !== null);
    // Write the matched fighters to a new JSON file
//    fs.writeFileSync('MatchedWarband.json', JSON.stringify(matchedFighters, null, 2), 'utf8');
    return matchedFighters;
}

// This function finds all relevant abilities from the matched fighters in the abilities.json database
function findRelevantAbilities(matchedFighters, abilityData) {
   abilitiesData = abilityData;

    // Filter abilities for the given warband and universal abilities
    const relevantAbilities = abilitiesData.filter(ability => 
        ability.warband === matchFighters.warband || ability.warband === 'universal'
    );

    // Add abilities specific to the matched fighters
    matchedFighters.forEach(fighter => {
        const fighterAbilities = abilitiesData.filter(ability => 
            ability.fighterName === fighter.name
        );
        relevantAbilities.push(...fighterAbilities);
    });

    // Remove duplicates (if any) based on ability name
    const uniqueAbilities = Array.from(new Map(relevantAbilities.map(ability => [ability.name, ability])).values());

    return uniqueAbilities;
}

function preparePDFReadyJson(parsedData, matchedFighters, abilities) {
    const pdfReadyData = {
        warbandName: parsedData.warbandName,
        faction: parsedData.faction,
        totalPoints: parsedData.totalPoints,
        fighterCount: parsedData.fighterCount,
    };

    // Flatten fighter data
    matchedFighters.forEach((fighter, index) => {
        Object.keys(fighter).forEach(key => {
            pdfReadyData[`fighter${index + 1}${key.charAt(0).toUpperCase() + key.slice(1)}`] = fighter[key];
        });

        // Flatten weapon data
        if (fighter.weapons) {
            fighter.weapons.forEach((weapon, weaponIndex) => {
                Object.keys(weapon).forEach(key => {
                    pdfReadyData[`fighter${index + 1}Weapon${weaponIndex + 1}${key.charAt(0).toUpperCase() + key.slice(1)}`] = weapon[key];
                });


            });
        }
    });

    // Flatten abilities data
    abilities.forEach((ability, index) => {
        Object.keys(ability).forEach(key => {
            pdfReadyData[`ability${index + 1}${key.charAt(0).toUpperCase() + key.slice(1)}`] = ability[key];
        });
    });

    // Write the final JSON to a file
    // writeFileSync('pdfready.json', JSON.stringify(pdfReadyData, null, 2), 'utf8');
    return pdfReadyData;
}


function downloadJSONFile(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}

// // Trigger the download of the JSON file
// downloadJSONFile(preparePDFReadyJson(parsedData, matchedFighters, warbandabilities), 'warband2pdf.json');

// Attach a click listener to the Generate CSV button. This keeps logic out of markup
// Initialize data when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    const loaded = await loadData();
    if (!loaded) {
        console.error('Failed to load required data files. Make sure fighters.json and abilities.json are present and the page is served from a web server.');
    }
});
document.getElementById('generate-btn').addEventListener('click', function () {
    const text = document.getElementById('warcrier-data').value || '';
    if (!text.trim()) {
        alert('Paste your WarCrier export into the textarea first.');
        return;
    }

console.log("Imported Fighter Data:", fighterData);
console.log("Imported Ability Data:", abilityData);

    // Parse the clipboard text from the textarea
    const parsedData = parseWarcryClipboard(text);
    console.log('Parsed Data:', parsedData);

    // Match fighters from the parsed data
    const matchedFighters = matchFighters(parsedData.fighters, fighterData);
    console.log('Matched Fighters:', matchedFighters);

    // Find relevant abilities for the matched fighters
    const warbandAbilities = findRelevantAbilities(matchedFighters, abilityData);
    console.log('Warband Abilities:', warbandAbilities);    

    // Prepare the final JSON data for PDF generation
    const pdfReadyData = preparePDFReadyJson(parsedData, matchedFighters, warbandAbilities);
    console.log('Prepared PDF Ready Data:', pdfReadyData);

    // Trigger the download of the JSON file
    downloadJSONFile(pdfReadyData, 'warband2pdf.json');

    console.log('JSON file generated and downloaded:', pdfReadyData);
});



// used during development, obsolete, probably.
// const sampleClipboard = `\`\`\`
// ----------
// \"Jorams Chaos Warriors\"
// Slaves to Darkness
// 965pts | 9 fighters | Valid ✓  

// - Aspiring Champion (155pts, Hero)
// - Chaos Warrior with Chaos Hand Weapon and Chaos Runeshield (100pts)
// - Chaos Warrior with Chaos Halberd and Chaos Runeshield (95pts)
// - Chaos Warrior with Chaos Halberd and Chaos Runeshield (95pts)
// - Chaos Warrior with Chaos Halberd and Chaos Runeshield (95pts)
// - Chaos Warrior with Chaos Hand Weapon and Chaos Runeshield (100pts)
// - Razek Godblessed (115pts)
// - Chaos Warrior with Chaos Greatblade (105pts)
// - Chaos Warrior with Chaos Greatblade (105pts)
// ----------
// Generated on Warcrier.net
// \`\`\``;

// // console.log(sampleClipboard);
// let parsedData = parseWarcryClipboard(sampleClipboard);
// //  console.log(result01);
// // console.log(matchFighters(result01.fighters));
// let matchedFighters = matchFighters(parsedData.fighters);
// const warbandabilities = findRelevantAbilities(matchedFighters);

// // console.log(matchedFighters);
// // console.log(findRelevantAbilities(matchedFighters));
// // preparePDFReadyJson(result01, matchedFighters, warbandabilities));
// // Function to trigger JSON file download
