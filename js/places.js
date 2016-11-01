var service, searchBox, searchQuery;
var map;
var markers = [],
    placesList = [];
var listCollapsed = false,
    count,
    call,
    arrminCount,
    arrmaxCount,
    htmlCount=0;


function placeSearch() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 37.774929,
            lng: -122.419416
        },
        zoom: 13,
        mapTypeId: 'roadmap'
    });

    //Infowindow for markers
    infowindow = new google.maps.InfoWindow();
    service = new google.maps.places.PlacesService(map);
    // Create the search box and link it to the UI element.
    searchQueryInput = document.getElementById('pac-input');
    searchBox = new google.maps.places.SearchBox(searchQueryInput);

    //set Location to  current map's viewport.
    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });

    //Event Listener for serach Box
    searchBox.addListener('places_changed', function() {
        count = 0;
        call = 1;
        arrminCount = 0;
        arrmaxCount = 20;
        placesList = [];
        //var places2 = searchBox.getPlaces();
        var query = $('#pac-input').val();
        var request = {
            bounds: map.getBounds(),
            query: query
        };

        service.textSearch(request, getPlaces);
    });



}

//Get list of Places
function getPlaces(results, status, pagination) {

    if(placesList.length === arrmaxCount)
      $("#next").prop("disabled", true);



    if (status == google.maps.places.PlacesServiceStatus.OK) {
        var places = results;
        if (places.length == 0)
            return;
        places.forEach(function(place) {
            placesList.push(place);
        });
        if (count === 0) {

            var subPlacesArr = placesList.slice(0, 20);
            processResults(subPlacesArr);
            count++;
        }
        //check, if there are more than 20 results
        if (pagination.hasNextPage) {

            $("#next").prop("disabled", false);
            if (call === 1) {
                call++;

                //for Query over limit
                setTimeout(function() {
                    //get next set of results
                    pagination.nextPage();
                }, 2000);

            } else {
                setTimeout(function() {

                    pagination.nextPage(getPlaces);
                }, 4000);
            }
        }
    }

}

//Iterate places to get details of each place
function processResults(subPlacesAr) {
    if (arrminCount === 0)
        $("#prev").prop("disabled", true);
    else {
        $("#prev").prop("disabled", false);
    }

    if (placesList.length <= arrmaxCount)
        $("#next").prop("disabled", true);
    else {
        $("#next").prop("disabled", false);
    }

    $("#list").empty();
    $(".totalResults").remove();

    markers.forEach(function(marker) {
        marker.setMap(null);
    });
    markers = [];

    var bounds = new google.maps.LatLngBounds();

    subPlacesAr.forEach(function(place) {
        if (!place.geometry)
            return;

        getDetails(place);

        if (place.geometry.viewport) {
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
        map.fitBounds(bounds);


    });

}

//Get details of each place
function getDetails(place) {
    service.getDetails({
        placeId: place.place_id
    }, function(placeobj, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            createContent(placeobj);
        } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {

            //for Query_over_limit
            setTimeout(function() {
                getDetails(place);
            }, 200);
        }
    });
}

//Create Markers Content and List content for each place
function createContent(place) {
   //Create Maker fo each place
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    markers.push(marker);

     //Get place photos
    if (place.photos) {
        var image = place.photos[0].getUrl({
            'maxWidth': 150,
            'maxHeight': 150
        });
    } else {
        image = "css/assets/noImage.png";
    }

    //Infowindow Content of marker
    var infoWindowcontent = '<div class="infoWindowcontent"><h5>'
                            + place.name + '</h5><p class="placeDetails"><span class="addressLabel"></span><span>'
                            + place.formatted_address + '</span></p>';

    //Content for list
    var content = '<div class="content"><img class="placeImage" src=' + image + '><h5>'
                  + place.name + '</h5><p class="placeDetails"><span class="addressLabel"></span><span>'
                  + place.formatted_address + '</span></p>';

   //Get opening hours
    if (place.opening_hours) {

        if (place.opening_hours.open_now)
            var openNow = "Open Now";
        else
            openNow = "Closed";

        infoWindowcontent += '<p class="placeDetails"><span class="hoursLabel"></span><span>' + openNow + '</span></p>';

        var date = new Date();
        var day = date.getDay() - 1;
        var openHours = "<select>";
        place.opening_hours.weekday_text.forEach(function(hours, index) {
            if (index === day)
                openHours += ' <option selected>' + hours + '</option>';
            else
                openHours += ' <option>' + hours + '</option>';
        });
        openHours += "</select>";
        content += '<p class="placeDetails"><span class="hoursLabel"></span><span>' + openHours + '</span></p>';
    }

    //Get website URL
    if (place.website) {

        var webpage = '<a href="' + place.website + '" target="_blank">' + place.website + '</a>';
        content += '<p class="placeDetails"><span class="websiteLabel"></span>' + webpage + '</p>';

    }

    //Get phone number
    if (place.formatted_phone_number) {

        var phoneNumber = '<a href="tel:' + place.formatted_phone_number + '">' + place.formatted_phone_number + '</a>';
        content += '<p class="placeDetails"><span class="phoneLabel"></span>' + phoneNumber + '</p>';
    }

    //Get rating
    if (place.rating) {

        var rating = place.rating;
        var val = parseFloat(rating);

        var size = Math.max(0, (Math.min(5, val))) * 16;
        var $span = '<span style="width:' + size + 'px"></span>';

        infoWindowcontent += '<p class="placeDetails"><span >' + place.rating
                             + '&nbsp;&nbsp;</span><span class="stars">' + $span + '</span></p>';
        content += '<p class="placeDetails"><span class="num">' + place.rating + '&nbsp;&nbsp;</span><span class="stars">'
                    + $span + '</span>';

    }

    //Get price level
    if (place.price_level) {

        var priceLevel = place.price_level;
        var priceRange = "";
        for (var i = 0; i < priceLevel; i++) {
            priceRange += "$";
        }
        content += '<span class="priceRange">&nbsp;&nbsp;' + priceRange + '</span></p>';

    }

    infoWindowcontent += "</div>";
    content += "</div>";

    //Event Listener for marker
    google.maps.event.addListener(marker, 'mouseover', function() {

        infowindow.setContent(infoWindowcontent);
        infowindow.open(map, this);

    });

    $("#list").append(content);
    $("#list").show("slow");
   if(htmlCount === 0){
    $("#footer").show();
    $("#footer").append("<span class='totalResults'>Showing Results:"+(arrminCount+1)+"-"+(arrmaxCount)+"</span>");

    $("#container").css({
        background: "rgb(191, 189, 189)",
        border: "5px groove",
        overflow: "scroll"
    });
    $("#collapse").show("slow");

     htmlCount++

  }

}

//Click event for next button
$("#next").on("click", function() {
    htmlCount = 0;
    arrminCount += 20;
    arrmaxCount += 20;
    var subPlacesArr = placesList.slice(arrminCount, arrmaxCount);
    processResults(subPlacesArr);
});

//Click event for previous button
$("#prev").on("click", function() {
    htmlCount = 0;
    arrminCount -= 20;
    arrmaxCount -= 20;
    var subPlacesArr = placesList.slice(arrminCount, arrmaxCount);
    processResults(subPlacesArr);
})

//Click event to collapse list
$("#collapse").on("click", function() {
      $("#container").toggleClass("listCollapsed");
      $("#footer").toggleClass("listCollapsed");
      $(this).toggleClass( "collapsed");

});
