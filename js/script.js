window.onload= init;

function init(){
  drawMap();
  setInterval(fetcheData, 3000);
}

var lastReportTime=0,
  totalSales=0,
  arrayGeneral=[],
  salesList= [],

  map,
  bestSellingCity= document.getElementById("bestSellingCity"),
  bestSale= document.getElementById("bestSale"),
  panelBody= document.getElementById("panelBody"),
  containerFluid= document.getElementById("container-fluid"),
  body= document.getElementsByTagName('body')[0],
  modalButton= document.getElementById('modalButton');

var graphData ={
  labels: [],
  datasets: [{
    label: 'Sales',
    data: [],
    backgroundColor: 'rgba(4, 76, 98,.7)',
    borderColor:'rgb(4, 76, 98)',
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

var salesDoughnut = document.getElementById("salesDoughnut");

var myDoughnutChart = new Chart(salesDoughnut, {
  type: 'doughnut',
  data: dataDoughnut,
  options: {
    maintainAspectRatio: true,
    responsive: true,
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        fontColor: '#777',
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

var salesGraph = document.getElementById("salesGraph");

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
    labels: {
      fontColor: '#777',
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
    hideLoader();
    updateSales(data)
  })
  .fail(function(err){
    console.log(err);
  });
}

function hideLoader(){
  let loader= document.getElementById('loader-bg');
  loader.classList.add('hide-loader');
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

var modalListWrapper,
    divModal;

function updateSales(sale){

  addSaleTime(sale);
  createTotalSales(sale);
  createLiveSales(sale);
  createLatestSales(sale);
  addDataToLineChart(sale)
  myLineChart.update();

  let repetition= addRepeated(sale);
  //if there are no repetitions, keep adding the sales to the array
  if(!repetition){
    arrayGeneral.push(sale);
  }
  arrayGeneral.sort(toAsc);
  createBestseller(arrayGeneral[0]);
  addDataToDon(sale);
  addPins(sale);
  if(modalListWrapper, divModal){
    updateModal()
  }
};

function addSaleTime(sale){
  var d = new Date();
  lastReportTime= d.getTime();
  sale.time= lastReportTime;
};

function addRepeated(sale){
  //if there's already a sale in the array, with the same name as the last one, add the sales
  for (obj of arrayGeneral){
    if(obj.name == sale.name){
      obj.sales += sale.sales;
      return true;
    }
  }
}

function toAsc(a,b){
    return b.sales-a.sales;
};

function createBestseller(bestSeller){
  $('#panel-body>div').addClass('animate-in');
  bestSale.innerHTML=bestSeller.sales;
  bestSellingCity.innerHTML=bestSeller.name;
  getAddress(bestSeller.latitude,bestSeller.longitude);
}

//create live sales table
function createLiveSales(sale){
  let salesDiv=document.getElementById("liveTable");
  let tr=document.createElement("tr");
  tr.setAttribute("class", "saleItem");
  tr.innerHTML="<td>" + sale.name + "</td><td>" +
              sale.sales + "</td><td> <small>" +
              prettyDate(new Date(sale.time)) +
              "</small></td>";
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

  let data= graphData.datasets[0].data;
  let lables= graphData.labels;

  //add data up untill 10 entries
  if (lables.length=== 10 && data.length===10){
    //if more than 10 remove the first one in the list
    data.shift();
    lables.shift();
  }
  data.push(sale.sales);
  lables.push(sale.name);
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
  updateBestSellerAddress(infowindow,addressPara);
  });
}

function updateBestSellerAddress(infowindow,addressPara){
  if(!addressPara){
    addressPara= document.createElement("p");
    addressPara.id= "topSellerAddress";
    addressPara.innerHTML = infowindow.content;
    panelBody.appendChild(addressPara);
  }else{
    addressPara.innerHTML = infowindow.content;
  };
};

function createLatestSales(sale){
  updateLatestSaleOne(sale);
  updateLatestSaleTwo(sale);
};

function updateLatestSaleOne(sale){

  let lsOne= document.getElementById("lsOne");

  if(lsOne.childNodes[0]){
    lsOne.removeChild(lsOne.childNodes[0])
  }
  let latestSaleOne= document.createElement("p");
  latestSaleOne.innerHTML=sale.name +
                  "<br> Sales: " + sale.sales +
                  " at: " + prettyDate(new Date(sale.time));
  latestSaleOne.classList.add("animate-in");
  lsOne.appendChild(latestSaleOne);
}


function updateLatestSaleTwo(sale){
  let lsTwo= document.getElementById("lsTwo");

  salesList.push(sale);
  if(salesList[salesList.length-2]){
    lsTwo.innerHTML= '';
    let latestSaleTwo= document.createElement("p");

    latestSaleTwo.innerHTML=salesList[salesList.length-2].name +
                    "<br> Sales: " + salesList[salesList.length-2].sales +
                    " at: " + prettyDate(new Date(salesList[salesList.length-2].time));
    latestSaleTwo.classList.add("animate-in");
    setTimeout(function(){lsTwo.appendChild(latestSaleTwo)}, 150);
  }
}

function addDataToDon(sale){

  let bestFive= arrayGeneral.slice(0,5);

  bestFiveNames= bestFive.map(function(sale){
    return sale.name;
  })

  bestFiveSales= bestFive.map(function(sale){
    return sale.sales;
  })

  dataDoughnut.labels= bestFiveNames;
  dataDoughnut.datasets[0].data= bestFiveSales;
  myDoughnutChart.update();
}

modalButton.addEventListener("click", createModalDiv)

function createModalDiv(){

  divModal= document.createElement("div");
  divModal.classList.add("modal");
  divModal.id= "myModal";
  containerFluid.appendChild(divModal);
  createModalContent(divModal);
  body.classList.add('bg-noScroll');
}

function createModalContent(divModal){
  createDivContent(divModal);
  window.addEventListener("click", function(event) {
    if (event.target == divModal) {
      closeModal()
    }
  });
}

function createDivContent(divModal){
  var divContent= document.createElement("div");
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
    closeModal()
  })
}

function closeModal(){
  divModal.style.visibility = "hidden";
  divModal.style.opacity= '0';
  setTimeout(function(){
    containerFluid.removeChild(containerFluid.children[1]);
  }, 500)
  body.classList.remove('bg-noScroll');
}

function crateDivContainingP(divModal, divContent){
  var headerContent= document.createElement("h2");
  headerContent.innerHTML= "List of all sales";
  divContent.appendChild(headerContent);
  modalListWrapper= document.createElement("div");
  modalListWrapper.classList.add("modal-list-wrapper");
  divContent.appendChild(modalListWrapper);
  divModal.style.visibility = "visible";
  divModal.style.opacity= '1';
  var loadingP= document.createElement("p");
  loadingP.classList.add("loader-para");
  loadingP.innerHTML= 'Loading...'
  modalListWrapper.appendChild(loadingP);
}

var pContentSums;

function updateModal(){
  modalListWrapper.innerHTML= '';
  for(item of arrayGeneral){
    pContentSums= document.createElement("p");
    pContentSums.classList.add("modalP");
    pContentSums.innerHTML= item.name + " sold: " + item.sales + " muffins";
    modalListWrapper.appendChild(pContentSums);
  }
}
