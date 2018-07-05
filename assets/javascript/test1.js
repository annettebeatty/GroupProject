// Doing bulk groupon pull, but the processing serially in Yelp

$(document).ready(function () {
    var saveit = [];
    var numToPull = 10;
    var grponPull = 20;
    var grpOffset = 0;
    var processing = 0;

    // Set up the CORS server link
    $.ajaxPrefilter(function (options) {
        if (options.crossDomain && $.support.cors) {
            options.url = 'https://ucsdcodingcampgp1.herokuapp.com/' + options.url;
        }
    });

    startTheShow();

    function startTheShow()
    {
        console.log("startTheShow: Entering");
        console.log("startTheShow: NumToPull = ", numToPull, "processing = ", processing);

        // Kick off the search
        groupOnSearch(groupOnComplete);
    }

    // Groupon Data is collected
    function groupOnComplete(grpOnArray)
    {
        console.log("groupOnComplete: grpOnArray = ", grpOnArray);
        
        // Kick off starting processing the Yelp data serially
        processMultiple(grpOnArray);
    }

    // This is the call back that processes multiple entries
    function processMultiple (grpOnArray)
    {
        console.log("processMultiple: Processing = ", processing);
        console.log("processMultiple: Object = ", grpOnArray[processing]);
        
        // Check if more to process
        if (processing < numToPull)
        {
            // Call the yelpID now with the Groupon data
            getYelpID(grpOnArray, processMultiple);

        }
    }

    // This function goes out to Groupon and grabs deals
    function groupOnSearch(groupOnComplete)
    {
        var url = "https://partner-api.groupon.com/deals.json?tsToken=US_AFF_0_201236_212556_0&lat=32.853431&lng=-117.182872&filters=category:food-and-drink&limit=" + grponPull + "&offset=" + grpOffset;

        $.ajax(url)
        .then(function (response) 
        {
            var grpOnArray = [];
            console.log("groupOnSearch: response", response);
            console.log("groupOnSearch: deal array size", response.deals.length);

            for (var i = 0; i < response.deals.length; i++)
            {
                var data =
                {
                    name: "",
                    streetAddress: "",
                    city: "",
                    state: "",
                    yelpID: "",
                    rating: 0,
                    price: "",
                    open: true,
                    review_count: 0,
                    categories: "",
                    deal: "",
                    dealUrl: ""
                }

                // Stuff the respoonse so we don't have to type the response.deals
                saveit = response.deals[i];
                console.log("groupOnSearch: saveit ", saveit);

                var Name = saveit.merchant.name;

                // Street, City and address are required, so if they don't have it,
                // we won't include this deal
                if (saveit.options[0].redemptionLocations[0] == null)
                    continue;

                if (saveit.options[0].redemptionLocations[0].streetAddress1 == null)
                    continue;
                else 
                    var Street = saveit.options[0].redemptionLocations[0].streetAddress1;
                
                if (saveit.options[0].redemptionLocations[0].city == null)
                    continue;
                else 
                    var City = saveit.options[0].redemptionLocations[0].city;
                
                if (saveit.options[0].redemptionLocations[0].state == null)
                    continue;
                else 
                    var State = saveit.options[0].redemptionLocations[0].state;

                // Debugging
                console.log("groupOnSearch: Groupon data - Name ", Name);
                console.log("groupOnSearch: Groupon data - Street ", Street);
                console.log("groupOnSearch: Groupon data - City ", City);
                console.log("groupOnSearch: Groupon data - State ", State);
                console.log("groupOnSearch: Groupon deal -  ", saveit.title);
                console.log("groupOnSearch: Groupon Deal URL ", saveit.dealUrl);

                // Save groupon data in the object
                data.name = Name;
                data.streetAddress = Street;
                data.city = City;
                data.state = State;
                data.deal = saveit.title;
                data.dealUrl = saveit.dealUrl;

                console.log("groupOnSearch: data object ", data);

                // Stuff this into an array we will use later
                grpOnArray.push(data);

                console.log("groupOnSearch: grpOnArray ", grpOnArray);
            }

            // Groupons all loaded in array.  Now need to start processing 
            groupOnComplete(grpOnArray);

        });
    }

    function getYelpID(grpOnArray)
    {
        var data = grpOnArray[processing];
        var Name = encodeURIComponent(data.name.trim());
        var Street = encodeURIComponent(data.streetAddress.trim());
        var City = data.city;
        var State = data.state;

        var term = "name=" + Name;
        var url = 'https://api.yelp.com/v3/businesses/matches?' + term + '&address1=' + Street + '&city=' + City + '&state=' + State + '&country=US'
        console.log("getYelpID: URL: ", url)

        // $.ajax(url, { headers: { Authorization: 'Bearer IOnOmcVyQA7g8bfItyRwB1JFyfXeJh0kXRqdwyKUjuxOP2LmvLLth68IN84LwKiAUSgtQN5Bikqdnm70id-_Sj_0U5vTewXNl7ycBkUayA45WB-ozhQ2VEq7-6AuW3Yx' }})
        $.ajax(url, { headers: { Authorization: 'Bearer s8fyDTIEAcaKIhVHE-YXji0_G6gyCKWLxbwwL5Hg1PQW-Eu_ErKZ-xeV0_xRqQ0VtEV7XpS540SpNB9q4aQkcW-fp43IhgOgfh0fHP_d8YdNVHCqqxgMCBDQ8_U6W3Yx' } })
            .then(function (response) {
                console.log("getYelpID: Yelp response", response);
                console.log("getYelpID: Yelp array", response.businesses.length);
                data.yelpID = response.businesses[0].id;
                console.log("getYelpID: Yelp ID: ", data.yelpID);
                console.log("getYelpID: grpOnArray : ", data);

                // Got the yelp ID, now get the yelp rich data
                getYelpData(grpOnArray, processMultiple);
        });
    }

    function getYelpData(grpOnArray, callback)
    {
        var data = grpOnArray[processing];

        console.log("getYelpData: dataobject ", data);
        // Now get the Yelp data we want from the ID
        url = 'https://api.yelp.com/v3/businesses/' + data.yelpID;

        console.log("getYelpData: URL ", url);
        // $.ajax(url, { headers: { Authorization: 'Bearer IOnOmcVyQA7g8bfItyRwB1JFyfXeJh0kXRqdwyKUjuxOP2LmvLLth68IN84LwKiAUSgtQN5Bikqdnm70id-_Sj_0U5vTewXNl7ycBkUayA45WB-ozhQ2VEq7-6AuW3Yx' }})
        $.ajax(url, { headers: { Authorization: 'Bearer s8fyDTIEAcaKIhVHE-YXji0_G6gyCKWLxbwwL5Hg1PQW-Eu_ErKZ-xeV0_xRqQ0VtEV7XpS540SpNB9q4aQkcW-fp43IhgOgfh0fHP_d8YdNVHCqqxgMCBDQ8_U6W3Yx' } })
            .then(function (response) {
                console.log("GetYelpData: Yelp ID search response ", response);

                // Ok, at this point we have all the data we need
                console.log("getYelpData: Name ", response.name);

                data.name = response.name;
                data.streetAddress = response.location.address1;
                data.rating = response.rating;
                data.price = response.price;
                data.open = response.hours[0].is_open_now;
                data.review_count = response.review_count;
                data.categories = response.categories;
                
                console.log("getYelpData: DisplayObject ", data);

                // Here's where we need to call showit
                showit(data);
                processing++;  // Move to next array element
                callback(grpOnArray);
        }); 
    
    }

}); // On document ready

function showit (displayObject) {
    console.log("showit:  Displaying data");

    var divIt = "<a href='" + displayObject.dealUrl + "' target='_blank'>" + displayObject.deal + "</a>";

    console.log("DivIt = ", divIt);

    // *** need to work in here *** //

    $("#resultsDiv").append(`
    <tr><td>${displayObject.name}</td>
    <td>${displayObject.streetAddress}</td>
    <td>${displayObject.rating}</td>
    <td>${displayObject.price}</td>
    <td>${displayObject.open}</td>
    <td>${displayObject.review_count}</td>
    <td>${divIt}</td></tr>`);
}