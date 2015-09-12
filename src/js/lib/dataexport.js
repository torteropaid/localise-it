app.dataexport = {

    strDelimiter : ';',
    filterRows: [],

    getCurrentDateStr: function() {
        var today = new Date();
        var dd    = today.getDate();
        var mm    = today.getMonth()+1; //January is 0!
        var yyyy  = today.getFullYear();

        if(dd<10) { dd='0'+dd;}
        if(mm<10) { mm='0'+mm;}

        today = yyyy + '_' + mm + '_' + dd;

        return today;
    },

    addRow: function(csvContent, data) {
        if(data instanceof Array) {
            var str = data.join(this.strDelimiter) + '';
            var str2 = str.replace(/ /g, "%20");
            data = '"' + str2 + '"';
            data = data.replace(new RegExp(this.strDelimiter, "g"),'"'+this.strDelimiter+'"');
        } else {
            data = data + '';
            data = data.replace(/ /g, "%20");
        }
        csvContent += data + '%0A';
        return csvContent;
    },

    addRows: function(csvContent, data) {
        var self = this;
        data.forEach(function(infoArray, index){
            csvContent = self.addRow(csvContent, infoArray);
        });

        return csvContent;
    },

    addObjKeys: function(csvContent, data, filter, rename) {
        filter = filter || [];
        rename = rename || {};

        var keys  = [];
        var first = this.getFirst(data);

        if(first !== null) {
            for(var k in first) {
                if(_.contains(filter, k) || filter.length === 0 ) {
                    if(rename.hasOwnProperty(k)) {
                        k = rename[k];
                    }
                    keys.push(k);
                }
            }
            csvContent = this.addRow(csvContent, keys);
        }

        return csvContent;
    },

    addObjParams: function(csvContent, data, filter, prefix) {
        filter = filter || [];
        var value;

        for (var key in data) {
            var obj  = data[key];
            var row  = [];
            for (var prop in obj) {
                if(obj.hasOwnProperty(prop) && typeof(prop) !== 'function') {
                    if(_.contains(filter, prop) || filter.length === 0 ) {
                        value = obj[prop];
                        if(this.__checkIsFloat(value)) {
                            value = this.__fitFloatForExcel(value);
                        }

                        if(prefix && prefix[prop]) {
                            row.push(prefix[prop] + value);
                        } else {
                            row.push(value);
                        }
                    }
                }
            }

            csvContent = this.addRow(csvContent, row);
        }

        return csvContent;
    },

    getFirst: function(obj) {
        var first = null;
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop) && typeof(prop) !== 'function') {
                first = obj[prop];
                break;
            }
        }

        return first;
    },

    download:  function(id, name, csvContent) {
        csvContent = app.controllerHelper.transform(csvContent); // Is needed for translatekeys
        var downloadLink = document.getElementById('#'+id);

        if(downloadLink !== null) downloadLink.parentNode.removeChild(downloadLink);

        downloadLink = document.createElement('a');
        downloadLink.setAttribute("id", id);
        downloadLink.href        = 'data:attachment/csv,' + csvContent;
        downloadLink.target      = '_blank';
        downloadLink.download    = this.getCurrentDateStr() + '_' + name + '.csv';

        document.body.appendChild(downloadLink);
        downloadLink.click();
    },

    __checkIsFloat: function(value) {
        if(value !== null && value !== undefined) {
            if(!isNaN(value) && value.toString().indexOf('.') != -1) {
                return true;
            }
        }

        return false;
    },

    __fitFloatForExcel: function(value) {
        var strValue = value.toString();
        var floatValue = parseFloat(value);

        if(floatValue > 0.0) {
            if( (strValue.length - strValue.indexOf('.')) < 4) {                
                while((strValue.length - strValue.indexOf('.')) < 4) { strValue = strValue + '0';}
                return strValue;
            } else {
                return strValue;
            }
        } else {
            return strValue;
        }
    }
};