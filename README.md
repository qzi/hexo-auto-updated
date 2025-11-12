# Hexo Auto Updated
A Visual Studio Code extension that update time stamp of `updated` in front matter of hexo when saving markdown document.

## Features
When saving document:
- Update last updated date and time 

Each of the fields will be detected with condition of settings.
By default settings, lines like the following will be detected:
```
// updated: 2025-11-09 11:00:00
```

If this extension does not work, please check the followings:
- The Line Limit setting is `20` lines from the beginning of the file by default, so it may be too small for your file.
- There is also the setting of the target file name (Filename Pattern), and `.vscode/settings.json` is ignored by default.
- This extension does not work if your VS Code Auto Save setting is `afterDelay`.

You can change the time stamp format and timezone with the following settings:
- The time stamp format can be changed with `luxonFormat`.
  - See: [Formatting (Luxon)](https://moment.github.io/luxon/#/formatting?id=table-of-tokens)
- The timezone can be set with `luxonTimezone`.
  - See: [Time zones and offsets (Luxon)](https://moment.github.io/luxon/#/zones?id=specifying-a-zone)
  - The default value is `system` which means the system's local timezone.

If you try to handle many situations with only setting values, the patterns may become complicated.
VS Code's standard features allow you to change the settings per project and per language.
Please use them together.


Depending on the situation, this extension seems not to be found in the VS Marketplace search.
In that case, please install from the above.


## Author
[Leon D. Qiu](https://github.com/qzi) inspired by lpubsppop01@[vscode-auto-timestamp](https://github.com/lpubsppop01/vscode-auto-timestamp) 

## License
[zlib License](https://github.com/lpubsppop01/vscode-auto-timestamp/raw/master/LICENSE.txt)
