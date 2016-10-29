"use strict";

"require wabi";

if(!window.wabi) {
	window.wabi = {};
}

wabi.data = function(raw, id, parent) 
{
	this.raw = raw ? raw : {};

	if(id !== undefined) {
		this.id = id;
	}
	else {
		this.id = "";
	}

	if(parent) {
		this.parent = parent;
	}
};

wabi.data.prototype = 
{
	set: function(key, value)
	{
		if(value === void(0)) 
		{
			if(wabi.dataProxy) 
			{
				wabi.dataProxy({ 
					id: this.genId(),
					type: "data",
					action: "set",
					value: key
				});
			} 
			else {
				this.performSet(key);
			}
		}
		else 
		{
			if(wabi.dataProxy) 
			{
				wabi.dataProxy({ 
					id: this.genId(),
					type: "data",
					action: "set",
					key: key,
					value: value
				});
			}
			else {
				this.performSetKey(key, value);
			}
		}
	},

	performSet: function(value) 
	{
		this.raw = value;

		if(this.watchers) 
		{
			var info;
			for(var n = 0; n < this.watchers.length; n++) {
				info = this.watchers[n];
				info.func.call(info.owner, "set", null, value, 0, this);
			}
		}
	},

	performSetKey: function(key, value) 
	{
		if(typeof value === "string") 
		{
			if(value[0] === "*") {
				var ref = new wabi.ref(value, key, this);
				this.raw[key] = ref;
				return ref;
			}
		}

		var index = key.indexOf(".");
		if(index === -1) 
		{
			if(value instanceof Object && !(value instanceof wabi.data)) {
				value = new wabi.data(value, key, this);
			}

			this.raw[key] = value;
		}
		else
		{
			var id;
			var data = this;
			var buffer = key.split(".");
			for(var n = 0; n < buffer.length - 1; n++) 
			{
				id = buffer[n];

				var currData = data.get(id);
				if(!currData) {
					currData = new wabi.data({}, id, data);
					data[id] = currData;
				}

				data = currData;
			}

			id = buffer[n];

			if(value instanceof Object && !(value instanceof wabi.data)) {
				value = new wabi.data(value, id, data);
			}

			data.raw[id] = value;
		}

		if(this.watchers) 
		{
			var info;
			for(var n = 0; n < this.watchers.length; n++) {
				info = this.watchers[n];
				info.func.call(info.owner, "set", key, value, 0, this);
			}
		}

		return value;
	},

	setKeys: function(value)
	{
		if(wabi.dataProxy) 
		{
			wabi.dataProxy({ 
				id: this.genId(),
				type: "data",
				action: "setkeys",
				value: value
			});
		}
		else {
			this.performSetKeys(value);
		}
	},	

	performSetKeys: function(value)
	{
		for(var key in value) {
			this.performSetKey(key, value[key]);
		}
	},

	add: function(key, value)
	{
		if(value === void(0)) 
		{
			if(wabi.dataProxy) 
			{
				wabi.dataProxy({ 
					id: this.genId(),
					type: "data",
					action: "add",
					value: key
				});
			}
			else {
				this.performAdd(key);
			}
		}
		else
		{
			if(wabi.dataProxy) 
			{
				wabi.dataProxy({ 
					id: this.genId(),
					type: "data",
					action: "add",
					key: key,
					value: value
				});
			}
			else {
				this.performAddKey(key, value);
			}
		}
	},

	push: function(key, value)
	{
		var buffer = this.get(key);
		if(!buffer) {
			buffer = new wabi.data([], "content", this);
			this.raw[key] = buffer;
		}
		else
		{
			if(!(buffer.raw instanceof Array)) {
				console.warn("(wabi.data) Key `" + key + "` is not an Array");
				return;
			}
		}

		buffer.add(value);
	},

	performAdd: function(value)
	{
		if(this.raw instanceof Array) 
		{
			if(value instanceof Object && !(value instanceof wabi.data)) {
				value = new wabi.data(value, this.raw.length + "", this);
			}

			this.raw.push(value);
		}
		else 
		{
			console.warn("(wabi.data.performAdd) Can peform add only to Array");
			return;
		}

		if(this.watchers) 
		{
			var info;
			for(var n = 0; n < this.watchers.length; n++) {
				info = this.watchers[n];
				info.func.call(info.owner, "add", null, value, -1, this);
			}
		}	
	},

	performAddKey: function(key, value)
	{
		if(this.raw instanceof Object) 
		{
			if(value instanceof Object && !(value instanceof wabi.data)) {
				value = new wabi.data(value, key, this);
			}
			else if(typeof value === "string" && value[0] === "*") {
				var ref = new wabi.ref(value, key, this);
				this.raw[key] = value;
				value = ref;
			}	

			this.raw[key] = value;
		}
		else 
		{
			console.warn("(wabi.data.performAddKey) Can peform add only to Object");
			return;
		}	

		if(typeof value === "string" && value[0] === "*") {
			var ref = new wabi.ref(value, key, this);
			this.raw[key] = value;
			value = ref;
		}	

		if(this.watchers) 
		{
			var info;
			for(var n = 0; n < this.watchers.length; n++) {
				info = this.watchers[n];
				info.func.call(info.owner, "add", key, value, -1, this);
			}
		}
	},

	remove: function(key)
	{
		// Remove self?
		if(key === undefined) {
			this.parent.remove(this.id);
		}
		else
		{
			if(wabi.dataProxy) 
			{
				wabi.dataProxy({ 
					id: this.genId(),
					type: "data",
					action: "remove",
					key: key
				});
			}
			else {
				this.performRemove(key);
			}
		}
	},

	performRemove: function(key)
	{
		var value = this.raw[key];
		delete this.raw[key];

		if(value instanceof wabi.data)
		{
			var refs = value.refs;
			if(refs)
			{
				for(var n = 0; n < refs.length; n++) {
					refs[n].$remove();
				}

				value.refs = null;
			}
		}
		else if(value instanceof wabi.ref) {
			value = value.instance;
		}

		if(this.watchers) 
		{
			var info;
			for(var n = 0; n < this.watchers.length; n++) {
				info = this.watchers[n];
				info.func.call(info.owner, "remove", key, value, -1, this);
			}
		}	
	},

	removeItem: function(key, id)
	{
		var item = this.raw[key];
		if(typeof(item) !== "object") {
			return;
		}

		if(item instanceof Array) {
			item.splice(id, 1);
		}
		else {
			delete item[id];
		}

		if(this.watchers) 
		{
			var info;
			for(var n = 0; n < this.watchers.length; n++) {
				info = this.watchers[n];
				info.func.call(info.owner, "removeItem", key, null, id, this);
			}
		}
	},

	get: function(index) 
	{
		if(index === "*") {
			return new wabi.data(this.raw, this.id, this.parent);
		}
		else if(index === "@") {
			return this.id;
		}

		var data;
		if(!isNaN(index) && index !== "") 
		{
			data = this.raw[index | 0];

			if(typeof(data) === "object" && !(data instanceof wabi.data)) {
				data = new wabi.data(data, index + "", this);
				this.raw[index] = data;
			}
		}
		else 
		{
			var cursor = index.indexOf(".");
			if(cursor === -1) 
			{
				data = this.raw[index];

				if(data)
				{
					if(typeof data === "object" && !(data instanceof wabi.data)) {
						data = new wabi.data(data, index + "", this);
						this.raw[index] = data;
					}
					else if(typeof data === "string" && data[0] === "*") {
						data = new wabi.ref(data, index, this);
						this.raw[index] = data;
						return data;
					}
				}
			}
			else
			{
				var buffer = index.split(".");
				data = this;
				for(var n = 0; n < buffer.length; n++)
				{
					data = data.getItem(buffer[n]);
				}
			}
		}

		return data;
	},

	getItem: function(id)
	{
		if(id === "*") {
			return new wabi.data(this.raw, this.id, this.parent);
		}

		var data;
		if(!isNaN(id) && id !== "") {
			data = this.raw[id | 0];
		}
		else 
		{
			data = this.raw[id];

			if(!data) {
				if(this.raw.content) {
					data = this.raw.content[id];
				}
			}
		}

		if(typeof(data) === "object" && !(data instanceof wabi.data)) {
			data = new wabi.data(data, id + "", this);
			this.raw[id] = data;
		}

		return data;
	},

	getFromKeys: function(keys)
	{
		var data = this;
		for(var n = 0; n < keys.length; n++) 
		{
			data = data.get(keys[n]);
			if(!data) {
				return null;
			}
		}

		return data;
	},

	genId: function()
	{
		if(!this.parent) { return this.id; }

		var id = this.id;
		var parent = this.parent;
		do 
		{
			if(!parent.id) { return id; }
			
			id = parent.id + "." + id;
			parent = parent.parent;
		} while(parent);

		return id;
	},

	watch: function(func, owner) 
	{
		if(!func) {
			console.warn("(wabi.data.watch) Invalid callback function passed");
			return;
		}
		if(!owner) {
			console.warn("(wabi.data.watch) Invalid owner passed");
			return;
		}

		if(this.watchers) {
			this.watchers.push(new this.Watcher(owner, func));
		}
		else {
			this.watchers = [ new this.Watcher(owner, func) ];
		}
	},

	unwatch: function(func, owner)
	{
		if(!this.watchers) { return; }

		var num = this.watchers.length;
		for(var n = 0; n < num; n++) 
		{
			var info = this.watchers[n];
			if(info.owner === owner && info.func === func) {
				this.watchers[n] = this.watchers[num - 1];
				this.watchers.pop();
				return;
			}
		}
	},

	sync: function() 
	{
		if(this.watchers) 
		{
			for(var n = 0; n < this.watchers.length; n++) {
				var info = this.watchers[n];
				info.func.call(info.owner, "sync", null, null, 0, this);
			}
		}	
	},

	__syncAsArray: function(data)
	{
		this.raw = data;

		if(this.watchers) 
		{
			for(var n = 0; n < this.watchers.length; n++) {
				var info = this.watchers[n];
				info.func.call(info.owner, "set", null, data, 0, this);
			}
		}	
	},

	__syncAsObject: function(data)
	{
		this.raw = {};

		for(var key in data)
		{
			var srcValue = this.raw[key];
			var targetValue = data[key];

			if(srcValue === void(0)) {
				this.raw[key] = targetValue;
			}
			else if(srcValue === targetValue) {
				srcValue = targetValue;
			}

			if(this.watchers) 
			{
				for(var n = 0; n < this.watchers.length; n++) {
					var info = this.watchers[n];
					info.func.call(info.owner, "set", key, targetValue, 0, this);
				}
			}
		}
	},

	removeRef: function(ref)
	{
		if(!this.refs) { 
			console.warn("(wabi.data.removeRef) No references created from this item");
			return;
		}

		var index = this.refs.indexOf(ref);
		this.refs[index] = this.refs[this.refs.length - 1];
		this.refs.pop();
	},

	toJSON: function() {
		return this.raw;
	},

	Watcher: function(owner, func) 
	{
		this.owner = owner ? owner : null,
		this.func = func;
	},

	//
	watchers: null,
	parent: null,
	refs: null
};

wabi.ref = function(path, id, parent) 
{
	this.id = id;
	this.path = path;
	this.parent = parent;

	var refPath = path.slice(1);
	this.instance = wabi.globalData.raw.assets.get(refPath);

	if(this.instance)
	{
		if(this.instance.refs) {
			this.instance.refs.push(this);
		}
		else {
			this.instance.refs = [ this ];
		}
	}
	else {
		console.warn("(wabi.ref) Invalid ref: " + refPath);
	}
};

wabi.ref.prototype = 
{
	remove: function()
	{
		this.instance.removeRef(this);
		this.instance = null;
		this.parent.remove(this.id);
	},

	$remove: function() {
		this.parent.remove(this.id);
	},

	toJSON: function() {
		return this.path;
	}
};
