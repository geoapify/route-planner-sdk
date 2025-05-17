import TEST_API_KEY from "../../../../demo-env-variables.mjs";

const myAPIKey = TEST_API_KEY;

async function makeRoutePlannerRequest(rawData) {
    const planner = new RoutePlannerSDK.RoutePlanner({ apiKey: myAPIKey });

    return await planner.setRaw(rawData).plan();
}

// create a map object
const map = new maplibregl.Map({
    container: 'my-map',
    center: [9.193347, 48.894660],
    zoom: 13,
    style: `https://maps.geoapify.com/v1/styles/klokantech-basic/style.json?apiKey=${myAPIKey}`,
});
map.addControl(new maplibregl.NavigationControl());

// this object describes
const deliveryOptimizationInput = {
    "mode": "drive",
    "agents": [
        {
            "id": "1",
            "start_location": [
                9.184216439347189,
                48.89244305
            ],
            "time_windows": [
                [
                    0,
                    10800
                ]
            ]
        },
        {
            "id": "2",
            "start_location": [
                9.18674538469634,
                48.89783585
            ],
            "time_windows": [
                [
                    0,
                    10800
                ]
            ]
        },
        {
            "id": "3",
            "start_location": [
                9.1927926,
                48.8967017
            ],
            "time_windows": [
                [
                    0,
                    10800
                ]
            ]
        }
    ],
    "shipments": [
        {
            "id": "order_1",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.183412901202828,
                    48.8899988
                ],
                "duration": 120
            }
        },
        {
            "id": "order_2",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.19023209753983,
                    48.893762699999996
                ],
                "duration": 240
            }
        },
        {
            "id": "order_3",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.19023209753983,
                    48.893762699999996
                ],
                "duration": 240
            }
        },
        {
            "id": "order_4",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.190336353219653,
                    48.8889067
                ],
                "duration": 120
            }
        },
        {
            "id": "order_5",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.190755039249733,
                    48.897658199999995
                ],
                "duration": 120
            }
        },
        {
            "id": "order_6",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.191433356582895,
                    48.89178365
                ],
                "duration": 240
            }
        },
        {
            "id": "order_7",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.2009995,
                    48.8921093
                ],
                "duration": 300
            }
        },
        {
            "id": "order_8",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.2009995,
                    48.8921093
                ],
                "duration": 120
            }
        },
        {
            "id": "order_9",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.192137418198186,
                    48.897954600000006
                ],
                "duration": 120
            }
        },
        {
            "id": "order_10",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.184559924148315,
                    48.89639175
                ],
                "duration": 300
            }
        },
        {
            "id": "order_11",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.184559924148315,
                    48.89639175
                ],
                "duration": 240
            }
        },
        {
            "id": "order_12",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.184000638884946,
                    48.88843665
                ],
                "duration": 120
            }
        },
        {
            "id": "order_13",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.185736215255474,
                    48.895250000000004
                ],
                "duration": 240
            }
        },
        {
            "id": "order_14",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.189437816773678,
                    48.89090105
                ],
                "duration": 300
            }
        },
        {
            "id": "order_15",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.192861519638404,
                    48.891440450000005
                ],
                "duration": 300
            }
        },
        {
            "id": "order_16",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.192861519638404,
                    48.891440450000005
                ],
                "duration": 120
            }
        },
        {
            "id": "order_17",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.192861519638404,
                    48.891440450000005
                ],
                "duration": 120
            }
        },
        {
            "id": "order_18",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.190367,
                    48.889267849999996
                ],
                "duration": 240
            }
        },
        {
            "id": "order_19",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.190762294420793,
                    48.88929005
                ],
                "duration": 120
            }
        },
        {
            "id": "order_20",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.191287838731487,
                    48.8982222
                ],
                "duration": 120
            }
        },
        {
            "id": "order_21",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.193888800570516,
                    48.890097749999995
                ],
                "duration": 120
            }
        },
        {
            "id": "order_22",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.193888800570516,
                    48.890097749999995
                ],
                "duration": 120
            }
        },
        {
            "id": "order_23",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.193888800570516,
                    48.890097749999995
                ],
                "duration": 240
            }
        },
        {
            "id": "order_24",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.194073809959113,
                    48.88997525
                ],
                "duration": 120
            }
        },
        {
            "id": "order_25",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.194073809959113,
                    48.88997525
                ],
                "duration": 240
            }
        },
        {
            "id": "order_26",
            "delivery": {
                "location_index": 0,
                "duration": 300
            },
            "pickup": {
                "location": [
                    9.194073809959113,
                    48.88997525
                ],
                "duration": 120
            }
        },
        {
            "id": "order_27",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.194073809959113,
                    48.88997525
                ],
                "duration": 120
            }
        },
        {
            "id": "order_28",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.194728246956767,
                    48.8886185
                ],
                "duration": 300
            }
        },
        {
            "id": "order_29",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.186853235422618,
                    48.89165215
                ],
                "duration": 120
            }
        },
        {
            "id": "order_30",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.18323054439795,
                    48.89242725
                ],
                "duration": 300
            }
        },
        {
            "id": "order_31",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.18323054439795,
                    48.89242725
                ],
                "duration": 120
            }
        },
        {
            "id": "order_32",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.181151730633804,
                    48.89319515
                ],
                "duration": 120
            }
        },
        {
            "id": "order_33",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.183504213017649,
                    48.892416
                ],
                "duration": 240
            }
        },
        {
            "id": "order_34",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.183504213017649,
                    48.892416
                ],
                "duration": 300
            }
        },
        {
            "id": "order_35",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.183504213017649,
                    48.892416
                ],
                "duration": 120
            }
        },
        {
            "id": "order_36",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.183504213017649,
                    48.892416
                ],
                "duration": 120
            }
        },
        {
            "id": "order_37",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.191733545518563,
                    48.8981717
                ],
                "duration": 120
            }
        },
        {
            "id": "order_38",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.191733545518563,
                    48.8981717
                ],
                "duration": 120
            }
        },
        {
            "id": "order_39",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.192214169458943,
                    48.8969103
                ],
                "duration": 120
            }
        },
        {
            "id": "order_40",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.192214169458943,
                    48.8969103
                ],
                "duration": 120
            }
        },
        {
            "id": "order_41",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.192214169458943,
                    48.8969103
                ],
                "duration": 300
            }
        },
        {
            "id": "order_42",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.192214169458943,
                    48.8969103
                ],
                "duration": 120
            }
        },
        {
            "id": "order_43",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.190582465275288,
                    48.896527
                ],
                "duration": 120
            }
        },
        {
            "id": "order_44",
            "delivery": {
                "location_index": 0,
                "duration": 300
            },
            "pickup": {
                "location": [
                    9.191318915116426,
                    48.896434150000005
                ],
                "duration": 120
            }
        },
        {
            "id": "order_45",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.191915156075172,
                    48.8963323
                ],
                "duration": 120
            }
        },
        {
            "id": "order_46",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.19186575017319,
                    48.896887449999994
                ],
                "duration": 120
            }
        },
        {
            "id": "order_47",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.19218795882151,
                    48.8970676
                ],
                "duration": 120
            }
        },
        {
            "id": "order_48",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.191752186199388,
                    48.8979816
                ],
                "duration": 120
            }
        },
        {
            "id": "order_49",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.191752186199388,
                    48.8979816
                ],
                "duration": 240
            }
        },
        {
            "id": "order_50",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.19231475544889,
                    48.89718525
                ],
                "duration": 120
            }
        },
        {
            "id": "order_51",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.190935580128544,
                    48.8970796
                ],
                "duration": 120
            }
        },
        {
            "id": "order_52",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.191237581069144,
                    48.89687255
                ],
                "duration": 120
            }
        },
        {
            "id": "order_53",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.191259990064424,
                    48.89835785
                ],
                "duration": 120
            }
        },
        {
            "id": "order_54",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.189159071207923,
                    48.89902705
                ],
                "duration": 120
            }
        },
        {
            "id": "order_55",
            "delivery": {
                "location_index": 0,
                "duration": 300
            },
            "pickup": {
                "location": [
                    9.18775789893363,
                    48.89597325
                ],
                "duration": 120
            }
        },
        {
            "id": "order_56",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.183913352395486,
                    48.896403750000005
                ],
                "duration": 120
            }
        },
        {
            "id": "order_57",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.183913352395486,
                    48.896403750000005
                ],
                "duration": 300
            }
        },
        {
            "id": "order_58",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.183913352395486,
                    48.896403750000005
                ],
                "duration": 120
            }
        },
        {
            "id": "order_59",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.188750121644059,
                    48.89922645
                ],
                "duration": 240
            }
        },
        {
            "id": "order_60",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.188750121644059,
                    48.89922645
                ],
                "duration": 240
            }
        },
        {
            "id": "order_61",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.180862606748452,
                    48.8940056
                ],
                "duration": 120
            }
        },
        {
            "id": "order_62",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.184803017806015,
                    48.89607615
                ],
                "duration": 120
            }
        },
        {
            "id": "order_63",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.184803017806015,
                    48.89607615
                ],
                "duration": 120
            }
        },
        {
            "id": "order_64",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.184803017806015,
                    48.89607615
                ],
                "duration": 120
            }
        },
        {
            "id": "order_65",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.18042123079287,
                    48.89205175
                ],
                "duration": 240
            }
        },
        {
            "id": "order_66",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.188619541605298,
                    48.89401885
                ],
                "duration": 120
            }
        },
        {
            "id": "order_67",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.180396649999999,
                    48.8933317
                ],
                "duration": 120
            }
        },
        {
            "id": "order_68",
            "delivery": {
                "location_index": 0,
                "duration": 300
            },
            "pickup": {
                "location": [
                    9.180396649999999,
                    48.8933317
                ],
                "duration": 120
            }
        },
        {
            "id": "order_69",
            "delivery": {
                "location_index": 0,
                "duration": 300
            },
            "pickup": {
                "location": [
                    9.184441186077782,
                    48.8942403
                ],
                "duration": 120
            }
        },
        {
            "id": "order_70",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.18481115,
                    48.8950301
                ],
                "duration": 120
            }
        },
        {
            "id": "order_71",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.180790183082976,
                    48.89312245
                ],
                "duration": 120
            }
        },
        {
            "id": "order_72",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.180483153523184,
                    48.8939536
                ],
                "duration": 120
            }
        },
        {
            "id": "order_73",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.180483153523184,
                    48.8939536
                ],
                "duration": 120
            }
        },
        {
            "id": "order_74",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.180483153523184,
                    48.8939536
                ],
                "duration": 120
            }
        },
        {
            "id": "order_75",
            "delivery": {
                "location_index": 0,
                "duration": 240
            },
            "pickup": {
                "location": [
                    9.180483153523184,
                    48.8939536
                ],
                "duration": 120
            }
        },
        {
            "id": "order_76",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.194068369971369,
                    48.8898948
                ],
                "duration": 120
            }
        },
        {
            "id": "order_77",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.180755338186572,
                    48.8932209
                ],
                "duration": 120
            }
        },
        {
            "id": "order_78",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.180755338186572,
                    48.8932209
                ],
                "duration": 120
            }
        },
        {
            "id": "order_79",
            "delivery": {
                "location_index": 0,
                "duration": 120
            },
            "pickup": {
                "location": [
                    9.180755338186572,
                    48.8932209
                ],
                "duration": 120
            }
        },
        {
            "id": "order_80",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.184375549976416,
                    48.895243949999994
                ],
                "duration": 120
            }
        },
        {
            "id": "order_81",
            "pickup": {
                "location_index": 0,
                "duration": 120
            },
            "delivery": {
                "location": [
                    9.184375549976416,
                    48.895243949999994
                ],
                "duration": 240
            }
        }
    ],
    "locations": [
        {
            "id": "warehouse-0",
            "location": [
                9.1880119,
                48.8966414
            ]
        }
    ]
};

// colors
const colors = ["#ff4d4d", "#1a8cff", "#00cc66", "#b300b3", "#e6b800", "#ff3385",
    "#0039e6", "#408000", "#ffa31a", "#990073", "#cccc00", "#cc5200", "#6666ff", "#009999"
];

map.on('load', () => {
    visualizeLocations(deliveryOptimizationInput, map);

    // solve route optimization task
    makeRoutePlannerRequest(deliveryOptimizationInput)
        .then(res => {
            notifyAboutIssues(res);
            res.getAgentSolutions().forEach((solution, index) => visualizeAgentWaypoints(solution, colors[index]));
            res.getAgentSolutions().forEach((solution, index) => visualizeAgentRoute(res, solution, colors[index], index));
        });
});





function visualizeLocations(deliveryTask, map) {
    // collect unique locations
    const locationMap = {};

    deliveryTask.shipments.forEach(shipment => {
        const locations = [shipment.pickup, shipment.delivery];
        locations.forEach((location, index) => {
            const locationStr = location.location_index >= 0 ? location.location_index.toString() : `${location.location[1]} ${location.location[0]}`;

            locationMap[locationStr] = locationMap[locationStr] || {
                location: location.location_index >= 0 ? deliveryTask.locations[location.location_index].location : location.location,
                delivery: [],
                pickup: []
            };

            if (index === 0) {
                locationMap[locationStr].pickup.push(shipment.id);
            } else {
                locationMap[locationStr].delivery.push(shipment.id);
            }
        });
    });

    // visualize lication as a layer
    const geoJSONObj = {
        "type": "FeatureCollection",
        "features": Object.keys(locationMap).map(locationKey => {
            return {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": locationMap[locationKey].location
                }
            }
        })
    };

    map.addSource('locations', {
        type: 'geojson',
        data: geoJSONObj
    });


    map.addLayer({
        'id': 'locations',
        'type': 'circle',
        'source': 'locations',
        'paint': {
            'circle-radius': 5,
            'circle-color': "#ff9933",
            'circle-stroke-width': 1,
            'circle-stroke-color': '#994d00',
        }
    });
}

function notifyAboutIssues(result) {
    if (result.getUnassignedAgents()?.length || result.getUnassignedJobs()?.length || result.getUnassignedShipments()?.length) {
        alert(`The solution has issues: ${Object.keys(result.properties.issues).join(', ')}`);
    }
}

function visualizeAgentWaypoints(solution, color) {
    const waypoints = solution.getWaypoints()
        .map((waypoint, index) => {
            return {
                "type": "Feature",
                "properties": {
                    index: index + 1
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": waypoint.getLocation()
                }
            }
        });

    // create points source + layer
    map.addSource(`agent-${solution.getAgentIndex()}-waypoints`, {
        type: 'geojson',
        data: {
            "type": "FeatureCollection",
            "features": waypoints
        }
    });

    map.addLayer({
        'id': `agent-${solution.getAgentIndex()}-waypoints-circle`,
        'type': 'circle',
        'source': `agent-${solution.getAgentIndex()}-waypoints`,
        'paint': {
            'circle-radius': 10,
            'circle-color': color,
            'circle-stroke-width': 1,
            'circle-stroke-color': "rgba(0,0,0,0.2)"
        }
    });

    map.addLayer({
        'id': `agent-${solution.getAgentIndex()}-waypoints-text`,
        'type': 'symbol',
        'source': `agent-${solution.getAgentIndex()}-waypoints`,
        'layout': {
            "text-field": '{index}',
            'text-allow-overlap': false,
            "text-font": [
                "Roboto", "Helvetica Neue", "sans-serif"
            ],
            "text-size": 12
        },
        'paint': {
            "text-color": "rgba(255, 255, 255, 1)"
        }
    });
}

function visualizeAgentRoute(res, solution, color, index) {
    const lineWidth = 7 - index;
    const shift = -2 + index * 2;

    res.getAgentRoute(solution.getAgentId(), {mode: 'drive'})
        .then(res => {
            map.addSource(`agent-${solution.getAgentIndex()}-route`, {
                type: 'geojson',
                data: res
            });

            map.addLayer({
                'id': `agent-${solution.getAgentIndex()}-route`,
                'type': 'line',
                'source': `agent-${solution.getAgentIndex()}-route`,
                'layout': {
                    'line-cap': "round",
                    'line-join': "round"
                },
                'paint': {
                    'line-color': color,
                    'line-width': lineWidth,
                    'line-translate': [shift, shift]
                }
            });

            map.moveLayer(`agent-${solution.getAgentIndex()}-waypoints-circle`);
            map.moveLayer(`agent-${solution.getAgentIndex()}-waypoints-text`);
        });
}