# em-ranks
A simple script for ranks processing in the EM 5th MC spreadsheet.

You need to create a new file named "content.txt". This file must contain a copy of Form Responses 2 without main titles.

It will skip all non-bancho links, weird formatted links, links to restricted or non-existent profiles. Entries that cannot be processed remain unchanged.

Since the number of entries is large, it will take time to complete so many requests to the api. All requests are based on a provided link and gamemode of current entry.

All results are sorted by the selected language and written to the appropriate txt files, taking into account all empty lines. Every file contains data for one column and can be just copy + pasted.
