class BetterRSS{

	constructor(options) {

		const events = require('events');
		const rss = require('rss-parser');
		this._url = require('url');

		this._events = new events.EventEmitter();
		this._rss = new rss();

		this.updateInterval = options.updateInterval ? options.updateInterval : 120000;
		this.feedLinks = options.feeds ? options.feeds : [];

		this._currentItems = {};

		this._updater = null;

		this.updateFeeds(true);

		// start auto update
		if(options.autoUpdate !== false){
			this.updater().start();
		}

	}

	updateFeeds(){

		// loop over all feed urls
		for(let url of this.feedLinks){

			// get _rss feed
			this._rss.parseURL(url)
				.then((feed) => {

					/*
					* Check if feed must be initialized.
					* A feed is not initialized, if in this.currentItem is no array.
					* If a feed is not initialized, the loop over items and event emitter will be ignored.
					* */
					if(typeof this._currentItems[feed.link] !== 'undefined'){

						// loop over all items in feed
						for(let item of feed.items){
							// check if there is a new item
							if(!this._currentItems[feed.link].includes(item.link)){
								this._events.emit("newItem", item, feed);
							}

						}

					}

					/*
					* Set _currentItems for this feed to array with links of all items
					* This will be done every time to be up-to-date with all items
					* */
					this._currentItems[feed.link] = Array.from(feed.items, (el) => el.link);

				})
				.catch((err) => {
					this._events.emit('error', err);
				});

		}

	}

	updater(){

		return {
			start: () => {

				// check if updater is null. If not, clear it
				if(this._updater !== null){
					clearInterval(this._updater);
				}

				this._updater = setInterval(() => {

					this._events.emit('updating');

					this.updateFeeds();

				}, this.updateInterval);

			},
			stop: () => {

				if(this._updater !== null){

					clearInterval(this._updater);
					this._updater = null;

					return true;

				}else{
					return false;
				}

			},
			update: () => this.updateFeeds()
		}

	}

	on(event, callback){

		this._events.on(event, callback);

	}

	feeds(){
		return {
			add: (url) => {

				if(!this.feedLinks.includes(url)){

					this.feedLinks.push(url);
					return true;

				}else{
					return false;
				}

			},
			get: (parsed = false) => {

				if(parsed){
					return Array.from(this.feedLinks, (el) =>this._url.parse(el));
				}else{
					return this.feedLinks;
				}

			},
			remove: (url) => {

				let index = this.feedLinks.indexOf(url);

				if(index > -1){

					this.feedLinks.splice(index, 1);
					return true;

				}else{
					return false;
				}

			},
			has: (url) => {

				return this.feedLinks.includes(url);

			},
			set: (urlArray) => {
				this.feedLinks = urlArray;
			}
		}
	}

	fetchFeed(feed){

		if(typeof feed === 'number'){

			if(this.feedLinks[feed]){
				return this._rss.parseURL(this.feedLinks[feed]);
			}else{
				return new Promise((resolve, reject)=>{
					reject({ error: 'feed_index_not_found' });
				});
			}

		}else{
			return this._rss.parseURL(feed);
		}

	}

}

module.exports = BetterRSS;