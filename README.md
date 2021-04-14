# em-ranks
A simple script that will help you to process all ranks in the EM 5th MC spreadsheet.

You need to create a new .txt file with any name. This file must contain a copy of Form Responses 1 or 2.

In order to run this script, you need Node.js because it uses the filesystem. When you run the script, pass the filename as a launch parameter. If the launch parameter was not passed, then by default the program will take the 'content.txt' file from the same folder as the script.

It will skip all non-bancho links, weird formatted links, links to restricted or non-existent profiles. Entries that cannot be processed will be replaced with empty lines.

Since the number of entries is large, it will take time to complete so many requests to the API. All requests are based on the profile link and gamemode of the current entry.

All results are sorted by the selected language and written to appropriate .txt files, taking into account all empty lines. Every file contains data for one column and can be just copy + pasted.
