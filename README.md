# better-rss
Better RSS is specialized library for rss feeds. It emits you updates on new items in a feed and fetches og images if no images are provided in feed.

## Installation
Go to your node project and run 
`npm install better-rss`

## Usage
Get updates about new items
```javascript
const betterRSS = require('./main');
const rss = new betterRSS({ updateInterval: 120000 });

rss.feeds().add('https://some-url.to/my/rss/feed.xml');

rss.on('newItem', (item, feed) => {
    // do your stuff
});
```
Fetch a feed directly
```javascript
const betterRSS = require('./main');
const rss = new betterRSS({ updateInterval: 120000 });

rss.getRSS('http://myrss.com/rss.xml')
    .then(data => console.log(data));
```

## Documentation

### Class `new betterRSS(options)`
- `options` | **object** | An object that will be given in the constructor
    - `feeds` | **array** | An array with strings of your rss feeds
    - `updateInterval` | **number** | A number that specify the interval of update requests in milliseconds
    - `autoUpdate` | **bool** | This boolean defines whether automatic updates should be performed
    - `extraImages` | **bool** | This boolean defines if the library should use og images if no default thumbnail is provided
    - `cacheImages` | **bool** | This boolean defines if the library should cache the image urls for og images for already fetched items
    - `itemLimit` | **number** | A number that specify a limit how many items in a feed should be processed
### Methods

### `getRSS(url)`
- `url` | **string** | The url you want to get the rss feed from
- **returns:** Promise

### `feeds()`
- `add(url)` | Add a feed to the list
    - `url` | **string** | The url to the rss feed
    - **returns:** boolean
        - *true* | Successful added
        - *false* | Already in feeds
        
- `get(feed)` | Get a feed from the list with data
    - `feed` | **string/number** | Define the feed that you want. (can be index in list or url itself)
    - **returns:** Array
    
- `getAll()` | Get all feeds with data
    - **returns:** Object
    
- `list(parsed)` | Get a list with all feed urls
    - `parsed` | **bool** | Define if you want to get an array with only strings or an array with parsed url objects
        - **returns:** Array
        
- `remove(feed)` | Remove a feed from the list
    - `feed` | **string** | The url to the rss feed
        - **returns:** boolean
            - *true* | Successful removed
            - *false* | Not found
- `has(url)` | Check if a feed is in the list
    - `url` | **string** | The url to the rss feed
        - **returns:** boolean
            - *true* | Found
            - *false* | Not found
    
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
    
### Default RSS Object
```javascript
let rss = {
    feed: {
        title: null,
        link: null,
        url: null,
        author: null,
        description: null,
        image: null
    },
    items: [
        {
            title: null,
            pubDate: null,
            link: null,
            guid: null,
            author: null,
            thumbnail: null,
            description: null,
            content: null,
            categories: []
        }
    ]
}
```