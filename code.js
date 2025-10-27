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
function findRelevantAbilities(matchedFighters, abilitiesData) {
    // 1. Collect all unique warband names from the fighters
    const warbandNames = Array.from(new Set(matchedFighters.map(f => f.warband).filter(Boolean)));

    // 2. Get all abilities for each warband and universal abilities
    let relevantAbilities = [];
    warbandNames.forEach(warbandName => {
        relevantAbilities.push(
            ...abilitiesData.filter(ability =>
                ability.warband === warbandName || ability.warband === 'universal'
            )
        );
    });

    // 3. Add abilities specific to the matched fighters (if any)
    matchedFighters.forEach(fighter => {
        const fighterAbilities = abilitiesData.filter(ability =>
            ability.fighterName === fighter.name
        );
        relevantAbilities.push(...fighterAbilities);
    });

    // 4. Remove duplicates by ability name
    const uniqueAbilities = Array.from(new Map(relevantAbilities.map(ability => [ability.name, ability])).values());

    return uniqueAbilities;
}

function preparePDFReadyJson(parsedData, matchedFighters, abilities) {
    // 1. Prepare warband info (header) data - just an array with one object
    const warbandInfo = [{
        name: parsedData.warbandName || '',
        faction: parsedData.faction || '',
        totalPoints: parsedData.totalPoints || 0,
        fighterCount: parsedData.fighterCount || 0,
        grand_alliance: matchedFighters[0]?.grand_alliance || '',
        subfaction: matchedFighters[0]?.subfaction || ''
    }];

    // 2. Prepare fighters data - array of fighter objects
    const fighters = matchedFighters.map(fighter => {
        const fighterData = {
            name: fighter.name || '',
            points: fighter.points || 0,
            movement: fighter.movement || 0,
            toughness: fighter.toughness || 0,
            wounds: fighter.wounds || 0,
            isHero: fighter.isHero || false,
            grand_alliance: fighter.grand_alliance || '',
            grand_alliance_image: `./images/factions-${(fighter.grand_alliance || '').replace(/ |:/g, '-')}-${(fighter.warband || '').replace(/ |:/g, '-')}.svg`,
            warband: fighter.warband || '',
            subfaction: fighter.subfaction || ''
        };

        // Flatten runemarks and add runemark-image keys
        if (fighter.runemarks && fighter.runemarks.length > 0) {
            fighter.runemarks.forEach((runemark, index) => {
            const num = index + 1;
            fighterData[`runemark${num}`] = runemark;
            fighterData[`runemark${num}-image`] = `./images/fighters-${(runemark || '').replace("hero", 'leader')}.svg`;
            });
        }

        // Add flattened weapon properties
        if (fighter.weapons && fighter.weapons.length > 0) {
            fighter.weapons.forEach((weapon, index) => {
                const num = index + 1;
                fighterData[`weapon${num}attacks`] = weapon.attacks || 0;
                fighterData[`weapon${num}strength`] = weapon.strength || 0;
                fighterData[`weapon${num}dmg_hit`] = weapon.dmg_hit || 0;
                fighterData[`weapon${num}dmg_crit`] = weapon.dmg_crit || 0;
                fighterData[`weapon${num}min_range`] = weapon.min_range || 0;
                fighterData[`weapon${num}max_range`] = weapon.max_range || 0;
                fighterData[`weapon${num}runemark`] = weapon.runemark || '';
                fighterData[`weapon${num}runemark-image`] = `./images/weapons-${(weapon.runemark || '').replace(/ /g, '-')}.svg`;
            });
        }

        return fighterData;
    });

// 3. Prepare abilities data - array of ability objects
const warbandAbilities = abilities.map(ability => {
    // Find the warband icon from the first matched fighter with the same warband
    const warbandImage =
        ability.warband === 'universal'
            ? ''
            : (
                fighters.find(f =>
                    f.warband &&
                    f.warband.trim().toLowerCase() === ability.warband.trim().toLowerCase()
                )?.grand_alliance_image || ''
            );

    const abilityObj = {
        name: ability.name || '',
        cost: ability.cost || '',
        description: ability.description || '',
        warband: ability.warband || '',
        warbandImage: warbandImage,
        _id: ability._id || ''
    };

    // Flatten sorted runemarks and add runemark-image keys
    const sortedRunemarks = Array.isArray(ability.runemarks) ? ability.runemarks.slice().sort() : [];
    if (sortedRunemarks.length > 0) {
        sortedRunemarks.forEach((runemark, index) => {
            const num = index + 1;
            // If runemark is an object, use its value
            const runemarkValue = typeof runemark === 'object' ? runemark.value || '' : runemark;
            abilityObj[`runemark${num}`] = runemarkValue;
            abilityObj[`runemark${num}-image`] = `./images/fighters-${(runemarkValue || '').replace("hero", 'leader')}.svg`;
        });
    }

    return abilityObj;
});
const costOrder = ['double', 'triple', 'quad', 'reaction'];

const sortedAbilities = warbandAbilities.slice().sort((a, b) => {
    // Get cost indices (default to a high value if not found)
    const aIndex = costOrder.indexOf((a.cost || '').toLowerCase());
    const bIndex = costOrder.indexOf((b.cost || '').toLowerCase());

    // Sort by cost order first
    if (aIndex !== bIndex) {
        return aIndex - bIndex;
    }
    // If cost is the same, sort by name alphabetically
    return (a.name || '').localeCompare(b.name || '');
});

    return {
        warbandInfo,
        fighters,
        warbandAbilities: sortedAbilities
    };
}

function downloadJSONFiles(data) {
    // Create a new ZIP file
    const zip = new JSZip();
    
    // Add each JSON file to the zip
    zip.file("warband_info.json", JSON.stringify(data.warbandInfo, null, 2));
    zip.file("warband_fighters.json", JSON.stringify(data.fighters, null, 2));
    zip.file("warband_abilities.json", JSON.stringify(data.warbandAbilities, null, 2));

    // Generate the zip file and trigger download
    zip.generateAsync({type: "blob"})
        .then(function(content) {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = "warband_data.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
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
// Update the click handler to use the new download function
document.getElementById('generate-btn').addEventListener('click', function () {
    const text = document.getElementById('warcrier-data').value || '';
    if (!text.trim()) {
        alert('Paste your WarCrier export into the textarea first.');
        return;
    }

    // Parse and prepare data as before
    const parsedData = parseWarcryClipboard(text);
    const matchedFighters = matchFighters(parsedData.fighters, fighterData);
    const warbandAbilities = findRelevantAbilities(matchedFighters, abilityData);
    
    // Prepare and download the three separate files
    const pdfReadyData = preparePDFReadyJson(parsedData, matchedFighters, warbandAbilities);
    downloadJSONFiles(pdfReadyData);
});


