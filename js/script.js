window.onload= init;

function init(){
  drawMap();
  setInterval(fetcheData, 3000);
}

var lastReportTime=0,
  totalSales=0,
  arrayGeneral=[],
  arrayGFLS= [],
  arraySums= [],
  arryaNames= [],
  dlUno= document.getElementById("dlUno"),
  dlDue= document.getElementById("dlDue"),
  map,
  bestSeller,
  sum,
  salesGraph = document.getElementById("salesGraph"),
  topSellers = document.getElementById("topSellers"),
  bestSellerP= document.getElementById("bestSellerP"),
  bestSellerH= document.getElementById("bestSellerH"),
  panelBody= document.getElementById("panel-body"),
  containerFluid= document.getElementById("container-fluid")

var graphData ={
  labels: [],
  datasets: [{
    label: 'Sales',
    data: [],
    backgroundColor: 'rgba(5, 97, 125, 0.2)',
    borderColor:'rgba(5, 97, 125, 1)',
    borderWidth: 1
  }]
};

var dataDoughnut ={
  labels: [],
    datasets: [{
      label: 'Sales',
      data: [],
      backgroundColor: ['rgba(5, 97, 125, 1)',
        'rgb(54, 62, 82)',
        'rgba(66, 189, 160, 1)',
        'rgba(91, 114, 185,1)',
        'rgba(118, 61, 143, 1)'],
      borderColor:['rgba(5, 97, 125, 1)',
        'rgb(54, 62, 82)',
        'rgba(66, 189, 160, 1)',
        'rgba(91, 114, 185,1)',
        'rgba(118, 61, 143, 1)'],
      borderWidth: 2
    }]
  };

var myDoughnutChart = new Chart(topSellers, {
  type: 'doughnut',
  data: dataDoughnut,
  options: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        fontColor: 'rgba(0, 0, 0, 0.7)',
        fontSize: 10
      }
    },
    scales: {
      xAxes: [{
        display: false
      }]
    },
    title: {
      display: true,
      fontSize: 8
    },
  }
});

var myLineChart = new Chart(salesGraph, {
  type: 'line',
  data: graphData,
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      yAxes: [{
        display: true,
        ticks: {
          beginAtZero: true,
          steps: 1,
          stepValue: 1,
          max: 10
        }
      }],
      xAxes: [{
        ticks: {
          maxRotation: 0 // angle in degrees
        }
      }]
    },
    title: {
      display: true,
      text: 'Live sales Updates'
    },
    tick:{
      fontSize:10,
    },
    tooltipFillColor: "rgba(0,0,0,0.8)",
  }
});

function fetcheData() {
  var url= "https://mighty-gumball-api.herokuapp.com/mighty_gumball_api";

  $.getJSON(url)
  .done(function(data) {
    updateSales(data)
  })
  .fail(function(err){
    console.log(err);
  });
}

var drawMap= function(){
  map = new google.maps.Map(document.getElementById('map'), {
  'center': {lat: 36.778261, lng: -119.41793239999998},
  'zoom': 5,
  'scrollwheel': false,
  'draggable': true,
  'mapTypeId': 'roadmap',
  });
  resizeMap()
};

function resizeMap(){
  //when the map tab is open
  $('a[href="#map-graph"]').on('shown.bs.tab', function(e){
    //resize
    google.maps.event.trigger(map, 'resize');
    //and set centre
    map.setCenter({lat: 37.422465, lng:  -120.530649});
  });
}

function updateSales(sale){
  createTotalSales(sale);
  createLiveSales(sale);
  addDataToLineChart(sale)
  myLineChart.update();
  arrayGeneral.push(sale);
  updateLatestSales(sale);
  findAbsoluteBestSeller(sale);
  if(arrayGeneral.length>1){
    findBestSeller();
  }
  addDataToDon(sale);
  if (map){
    addPins(sale);
  }
  if(sale.length>0){
    lastReportTime= sales[sales.length-1].time;
  }
};

function toAsc(a,b){
    return b.sales-a.sales;
};

function toDisc(a,b){
    return b.sales-a.sales;
};

function findBestSeller(){
    arrayGeneral.sort(toAsc);
    if(arraySums[0]){
        if(arrayGeneral[0].sales>arraySums[0].sales){
            bestSellerH.innerHTML=arrayGeneral[0].sales;
            bestSellerP.innerHTML=arrayGeneral[0].name;
            getAddress(arrayGeneral[0].latitude,arrayGeneral[0].longitude);
        }
    }else{
        bestSellerH.innerHTML=arrayGeneral[0].sales;
        bestSellerP.innerHTML=arrayGeneral[0].name;
        getAddress(arrayGeneral[0].latitude, arrayGeneral[0].longitude);
    }
};

function findAbsoluteBestSeller(sale){
    arrayNames= sortArrayGByName();

    if(arrayNames.indexOf(sale.name)>0 && arrayNames.indexOf(sale.name) !== arrayNames.lastIndexOf(sale.name)){
        let arrayNameRepeated= crateArrayRepeatedName(sale);
        sum= findSum(arrayNameRepeated)

        deleteCopies();
        arraySums.push(sum);
        arraySums.sort(toDisc);
        // console.table(arraySums);
        updateBestseller(arraySums);
    }
}

function deleteCopies(){
  for (var obj of arraySums){
    if (obj.name === sum.name){
      removeByAttr(arraySums, 'name', obj.name);
    }
  }
}

function crateArrayRepeatedName(sale){
  return arrayGeneral.filter(function(singleSale){
    if(singleSale.name== sale.name){
      return singleSale.name;
    }
  })
};

var removeByAttr = function(arr, attr, value){
  var i = arr.length;
  while(i--){
    if(arr[i]
      && arr[i].hasOwnProperty(attr)
      && (arguments.length > 2 && arr[i][attr] === value)){
        arr.splice(i,1);
    }
  }
  return arr;
}

function sortArrayGByName(){
  return arrayGeneral.map(function(singleSale){
    return singleSale.name;
  });
}

function findSum(arrayNameRepeated){
  let sum= 0,
    name,
    lat,
    long;
  for (var item of arrayNameRepeated){
    sum += item.sales;
    name= item.name;
    lat= item.latitude;
    long= item.longitude;
  }
  return {sales :sum, name: name, latitude: lat, longitude: long};
  }

function updateBestseller(arraySums){
  if(arraySums[0].sales>arrayGeneral[0].sales){
    bestSellerH.innerHTML=arraySums[0].sales;
    bestSellerP.innerHTML=arraySums[0].name;
    getAddress(arraySums[0].latitude,arraySums[0].longitude);
  }
}

//create live sales table
function createLiveSales(sale){
  let salesDiv=document.getElementById("liveTable");
  let tr=document.createElement("tr");
  tr.setAttribute("class", "saleItem");
  tr.innerHTML="<td>" + sale.name + "</td><td>" + sale.sales + "</td><td> <small>" + prettyDate(new Date(sale.time)) + "</small></td>";
  salesDiv.insertBefore(tr, salesDiv.childNodes[0]);
}

//total sales for header
function createTotalSales(sale){
  totalSales+= sale.sales;
  document.getElementById("totalSalesH").innerHTML= totalSales;
}

function prettyDate(date) {
  if(date.getUTCMinutes()<10){
    return date.getUTCHours()+':0'+date.getUTCMinutes();
  }else{
    return date.getUTCHours()+':'+date.getUTCMinutes();
  }
}

function addDataToLineChart(sale){

  //add data up untill 10 entries
  if (graphData.labels.length=== 10 && graphData.datasets[0].data.length===10){
    //if more than 10 remove the first in the list
    graphData.datasets[0].data.shift();
    graphData.labels.shift();
  }
  graphData.datasets[0].data.push(sale.sales);
  graphData.labels.push(sale.name);
}

function addPins(sale){
  let coords =  {latitude: sale.latitude, longitude: sale.longitude};
  let latLng = new google.maps.LatLng(coords.latitude, coords.longitude);
  let marker = new google.maps.Marker({
    position: latLng,
    map: map,
    draggable: true,
    animation: google.maps.Animation.DROP
  });
  addInfoWindow(marker,sale);
}

function addInfoWindow(marker,sale){
  let contentString = sale.name + ' <br> Sales: ' + sale.sales;
  let infowindow = new google.maps.InfoWindow({
    content: contentString
  });

  marker.addListener('mouseover', function() {
    infowindow.open(map, marker);
  });

  marker.addListener('mouseout', function() {
    infowindow.close(map, marker);
  });
}

function getAddress(myLatitude,myLongitude) {
  let geocoder= new google.maps.Geocoder();
  let location= new google.maps.LatLng(myLatitude, myLongitude);
  let infowindow = new google.maps.InfoWindow;
  let addressPara= document.getElementById("topSellerAddress");
  geocoder.geocode({'latLng': location}, function (results, status) {
    if(status == google.maps.GeocoderStatus.OK) {
      infowindow.setContent(results[1].formatted_address);
    }else{
      return false;
    }
  updateBestSellerP(infowindow,addressPara);
  });
}

function updateBestSellerP(infowindow,addressPara){
  if(!addressPara){
    addressPara= document.createElement("p");
    addressPara.id= "topSellerAddress";
    addressPara.innerHTML = infowindow.content;
    panelBody.appendChild(addressPara);
  }else{
    addressPara.innerHTML = infowindow.content;
  };
};

function updateLatestSales(sale){
  updateLatestSaleOne(sale);
  updateLatestSaletwo(sale);
};

function updateLatestSaleOne(sale){
  if(dlUno.childNodes[0]){
    dlUno.removeChild(dlUno.childNodes[0])
  }
  arrayGFLS.push(sale);
  console.log(arrayGFLS);
  console.log(arrayGeneral);
  let paraLSUno= document.createElement("p");
  paraLSUno.innerHTML=arrayGFLS[arrayGFLS.length-1].name +
                  "<br> Sales: " + arrayGFLS[arrayGFLS.length-1].sales +
                  " at: " + prettyDate(new Date(arrayGFLS[arrayGFLS.length-1].time));
  paraLSUno.classList.add("animate-in");
  dlUno.appendChild(paraLSUno);
}

function updateLatestSaletwo(sale){
  if(arrayGFLS[arrayGFLS.length-2]){

    dlDue.innerHTML= '';
    /*
    if(dlDue.childNodes[0]){
        if(dlDue.childNodes[1]){
            console.log(dlDue.childNodes[1])
            dlDue.removeChild(dlDue.childNodes[1])
            console.log(dlDue.childNodes[1])
            console.log("dentro");
        }
        dlDue.removeChild(dlDue.childNodes[0])
    }
    */
    let paraLSDue= document.createElement("p");

    paraLSDue.innerHTML=arrayGFLS[arrayGFLS.length-2].name +
                    "<br> Sales: " + arrayGFLS[arrayGFLS.length-2].sales +
                    " at: " + prettyDate(new Date(arrayGFLS[arrayGFLS.length-2].time));
    paraLSDue.classList.add("animate-in");
    setTimeout(function(){dlDue.appendChild(paraLSDue)}, 100);
  }
}

function addDataToDon(sale){
  let arrayOfBest= findArrayOfBest();
  let arrayFor5Best= [];
  let arrayOfFiveBest= findBestFive(arrayOfBest, arrayFor5Best);
  dataDoughnut.labels= findArrayBest5Names(arrayOfFiveBest);
  dataDoughnut.datasets[0].data= findArrayBest5Sales(arrayOfFiveBest);
  myDoughnutChart.update();
}

function findArrayOfBest(){
  if(arraySums){
    return arrayGeneral.concat(arraySums).sort(function(a,b){
        return b.sales-a.sales;
    })
  }else{
    return arrayGeneral;
  }
}

function findBestFive(arrayOfBest, arrayFor5Best){
  if(arrayOfBest.length<5){
    for (var item of arrayOfBest){
      arrayFor5Best.push({name: item.name, sales: item.sales})
    }
  }else  if(arrayOfBest.length>= 5){
    for (var i=0; i<=4; i++){
      arrayFor5Best.push({name: arrayOfBest[i].name, sales: arrayOfBest[i].sales})
    }
  }
  return arrayFor5Best;
}

function findArrayBest5Names(arrayOfFiveBest){
  return arrayOfFiveBest.map(function(items){
    return items.name;
  })
}

function findArrayBest5Sales(arrayOfFiveBest){
  return arrayOfFiveBest.map(function(items){
    return items.sales;
  })
}

panelBody.addEventListener("click", createModalDiv)

function createModalDiv(){

  let divModal= document.createElement("div");
  divModal.classList.add("modal");
  divModal.id= "myModal";
  containerFluid.appendChild(divModal);
  createModalContent(divModal);
}

function createModalContent(divModal){
  createDivContent(divModal);
  window.addEventListener("click", function(event) {
    if (event.target == divModal) {
      containerFluid.removeChild(divModal)
    }
  })
}

function createDivContent(divModal){
  let divContent= document.createElement("div");
  divContent.classList.add("modal-content");
  divModal.appendChild(divContent);
  createModalSpan(divModal,divContent)
}

function createModalSpan(divModal,divContent){
  let modalSpan= document.createElement("span");
  modalSpan.classList.add("close");
  modalSpan.innerHTML= "&times;";
  divContent.appendChild(modalSpan);
  crateDivContainingP(divModal, divContent);
  modalSpan.addEventListener("click", function(){
      containerFluid.removeChild(divModal);
  })
}

function crateDivContainingP(divModal, divContent){
  var headerContent= document.createElement("p");
  headerContent.innerHTML= "<h2>Best sellers shops</h2>";
  divContent.appendChild(headerContent);
  var divContainingP= document.createElement("div");
  divContainingP.classList.add("divContainingP");
  divContent.appendChild(divContainingP);

  createPContent(divContainingP, divModal);
}

function createPContent(divContainingP, divModal){
  if(arraySums.length>0){
    for (var item of arraySums){
      if(item.sales>9){
        var pContentSums= document.createElement("p");
        pContentSums.classList.add("modalP");
        pContentSums.innerHTML= item.name + " sold: " + item.sales + " muffins";
        divContainingP.appendChild(pContentSums);
      }
    }
  }
  divModal.style.display = "block";
}
