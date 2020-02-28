# better-rss
Better RSS is a wrapper around [rss-parser](https://github.com/rbren/rss-parser) with auto-update, events and some useful features.

## Installation
Go to your node project and run 
`npm install better-rss`

## Usage
```javascript
const betterRSS = require('./main');
const rss = new betterRSS({ updateInterval: 120000 });

rss.feeds().add('https://some-url.to/my/rss/feed.xml');

rss.on('newItem', (item, feed) => {
    // do your stuff
});
```

## Documentation

### Class `new betterRSS(options)`
- `options` | **object** | An object that will be given in the constructor
    - `feeds` | **array** | An array with strings of your rss feeds
    - `updateInterval` | **number** | A number that specify the interval of update requests in milliseconds
    - `autoUpdate` | **bool** | This boolean defines whether automatic updates should be performed
    
### Methods
### `feeds()`
- `add(url)`
    - `url` | **string** | The url to the rss feed
    - **returns:** boolean
        - *true* | Successful added
        - *false* | Already in feeds
- `get(parsed)`
    - `parsed` | **bool** | Define if you want to get an array with only strings or an array with parsed url objects
    - **returns:** Array
- `remove(url)`
    - `url` | **string** | The url to the rss feed
        - **returns:** boolean
            - *true* | Successful removed
            - *false* | Not found
- `has(url)`
    - `url` | **string** | The url to the rss feed
        - **returns:** boolean
            - *true* | Found
            - *false* | Not found
- `set(urlArray)`
    - **urlArray** | *Array* | Array with strings (your rss urls)
    
### `updater()`
- `start()` | Start the auto updater
- `stop()` | Stop the auto updater
    - **returns:**
        - *true* | Successful stopped
        - *false* | Cant stopped because auto updater not running
- `update()` | Update all rss feeds now

### `on(event, callback)`
- `event` | **string** | The event that you want to listen on
- `callback([args])` | **function** | The callback function that will be triggered on an event

### `fetchFeed(url)`  `fetchFeed(index)`
- `url` | **string** | A url to a rss feed
- `index` | **number** | Index of a feed in feeds
- **returns:**
    - *Promise*

### `updateFeeds()`
Updates all feeds. Please not use this. Use `updater().update()` instead.

### Events
- **updating** | Will be triggered when the auto updater updates all rss feeds
    - No callback args
- **error** | Triggered when an error occurs
    - `err` | **object** | Error object in callback arg
- **newItem** | Executed if a new item in a feed is available
    - `item` | **object** | RSS item object
    - `feed` | **object** | RSS feed object