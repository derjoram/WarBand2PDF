# Warband2PDF creates customizable high quality Warband summaries

This project is for you, if you

- want to use [Warcrier.net](https://warcrier.net) to build your own warband
- want to customize images and/or numbers in your warband
- have access to [Affinity Studio](https://www.affinity.studio).

Since Affinity’s redesign in late 2025, the previously paid software became free to use. This makes this little tool incredibly accessible to anyone who wants to build custom rosters with minimal copy paste work. 

## Features

- Creates fully customizable layout pages
- Integrates the warcrier database to avoid the need for any copy-paste work for stats, runemarks or abilites
- Creates a list of all relevant abilities, also for warbands with mixed factions.
- Easy integration of custom images for fighters through the functionality of Affinity Studio.

## Example

![sample image 01 - fighters](https://github.com/derjoram/WarBand2PDF/blob/main/images/Sample-image-00001.jpg?raw=true)

![sample image 02 - abilities 1](https://github.com/derjoram/WarBand2PDF/blob/main/images/Sample-image-00002.jpg?raw=true)

![sample image 03 - abilities 2](https://github.com/derjoram/WarBand2PDF/blob/main/images/Sample-image-00003.jpg?raw=true)

## Use

1. Download this entire repo including the images folder to your machine. On unix-based systems, open a terminal  and enter the command below to start a local web server.

	```
	cd $pathToDirectory
	python3 -m http.server 8000
	```
2. In your web browser, go to localhost:8000. You’ll find a simple website which runs the included javascript.
3. Use warcrier.net to create your warband. Export the warband to clipboard using warcrier’s export feature.
4. Paste the text snippet into the text input area of this tool. Click “Generate JSON.”
3. It will generate three json files in a zip file. Store them on your machine. 
4. Open the affinity templates included in this repo in affinity. 
5. Using the “Data merger” pane, “replace” the embedded json with your freshly created json files. Use the -fighter.json file for the fighter template and the -abilities.json for the  abilities template. 
6. Click “Generate”. A new tab will open with the generated document. Now you can edit the template.
	1. Change the header through the master page.
	2. Combine the abilities and fighter documents into a single document using copy-paste. 
	3. Delete any abilities or empty weapon slots that you don’t need.
	4. Replace the image placeholder with portraits of your fighters.
7. Save as PDF, print, play!

## Troubleshooting

### There are no icons for runemarks, weapons or factions!

Make sure to use the template while it is saved to the original repo folder. The image lookup uses relative paths. If you save the template to a different location, the relative paths won’t work. 

## Disclaimer

This project is heavily vibe coded, so it probably isn't the prettiest code to look at. Sorry. 

It is based on [Warcry_data by Krisling049 ](https://github.com/krisling049/warcry_data/tree/main) but not affiliated in any way with the project.

> **⚠️ Unofficial Fan Project**
> 
> This is an entirely unofficial fan project and is in no way associated with Games Workshop or any other company. It is a non-commercial and non-profit project developed out of love for Warcry as a game and setting.
>
> **No commercial use** • **No money requested or received** • **Personal time contribution only**