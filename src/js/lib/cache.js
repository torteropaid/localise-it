/*global Persist:false, log:false, Debug:false*/
/*jshint smarttabs:true*/

/**
 * @module Library
 */

/**
 * cache class
 *
 * wrapper for html5 and gears caching
 *
 * @class Cache
 */
app.Cache = {
    cache: false,
    /**
     * initialize cache
     *
     * check for html5 storage implementation or gears support
     * and initialize the selected cache
     *
     * @method init
     */
    init: function () {
        if (Config.Debug.ignoreCache) {
            console.log('local storage or gears cache ignored for debugging!');
            return;
        }
        this.cache = new Persist.Store('CommScope ION');
    },

    /**
     * checks if html5-cache is active
     *
     * @method isActive
     * @return {Boolean}  true if html5-cache is active
     */
    isActive: function () {
        return typeof this.cache === 'object';
    },

    /**
     * add an item to the cache
     *
     * @method setItem
     * @param  {String} key    key to reference the stored value
     * @param  {String} value  value to store in the cache
     */
    setItem: function (key, value) {
        if (typeof key !== 'string' || typeof value !== 'string') {
            return false;
        }

        if (this.isActive()) {
            this.cache.set(key, value);
        }

        return true;
    },

    /**
     * check for item existence in the cache
     *
     * @method hasItem
     * @param  {String} key  key to search for
     * @return {Boolean}     true if an item is found
     */
    hasItem: function (key) {
        return this.getItem(key) !== false;
    },

    /**
     * gets an item from the cache
     *
     * @method getItem
     * @param  {String} key  key to search for
     * @return {String}      stored value, if found. otherwise false
     */
    getItem: function (key) {
        var waiting = true, result = false, cache = this.cache;

        if (this.isActive()) {
            var callback = function (ok, val) {
                if (ok && typeof val === 'string') {
                    result = val;
                }
                waiting = false;
            };

            // wait for the function to finish (asynchron to synchron)
            while (waiting) {
                cache.get(key, callback);
            }

            return result;
        }

        return false;
    },

    /**
     * removes an item from the cache
     *
     * @method removeItem
     * @param  {String}   key  key to search for
     * @return {Boolean}
     */
    removeItem: function (key) {
        if (typeof key !== 'string') {
            return false;
        }

        if (this.isActive()) {
            this.cache.remove(key);
        }

        return true;
    },

    clear: function () {
        if (this.isActive()) {
            this.cache.flush();
        }
    }
};
