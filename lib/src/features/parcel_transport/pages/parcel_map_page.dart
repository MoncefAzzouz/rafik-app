import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'parcel_details_page.dart';
import 'parcel_vehicle_select_page.dart'; // import VehicleType
import '../../../core/utils/smooth_page_route.dart';

class Wilaya {
  final int number;
  final String nameAr;
  final String nameEn;
  final LatLng coordinate;

  const Wilaya({
    required this.number,
    required this.nameAr,
    required this.nameEn,
    required this.coordinate,
  });

  String get displayName => '${number.toString().padLeft(2, '0')} - $nameAr ($nameEn)';
}

class ParcelMapPage extends StatefulWidget {
  final VehicleType selectedVehicle;

  const ParcelMapPage({
    super.key,
    required this.selectedVehicle,
  });

  @override
  State<ParcelMapPage> createState() => _ParcelMapPageState();
}

class _ParcelMapPageState extends State<ParcelMapPage> {
  final TextEditingController _pickupController = TextEditingController();
  final TextEditingController _deliveryController = TextEditingController();
  final MapController _mapController = MapController();

  Wilaya? _pickupWilaya;
  Wilaya? _deliveryWilaya;

  // Algeria 58 Wilaya Database
  final List<Wilaya> _wilayas = const [
    Wilaya(number: 1, nameAr: 'أدرار', nameEn: 'Adrar', coordinate: LatLng(27.87, -0.29)),
    Wilaya(number: 2, nameAr: 'الشلف', nameEn: 'Chlef', coordinate: LatLng(36.16, 1.33)),
    Wilaya(number: 3, nameAr: 'الأغواط', nameEn: 'Laghouat', coordinate: LatLng(33.80, 2.88)),
    Wilaya(number: 4, nameAr: 'أم البواقي', nameEn: 'Oum El Bouaghi', coordinate: LatLng(35.87, 7.11)),
    Wilaya(number: 5, nameAr: 'باتنة', nameEn: 'Batna', coordinate: LatLng(35.55, 6.17)),
    Wilaya(number: 6, nameAr: 'بجاية', nameEn: 'Béjaïa', coordinate: LatLng(36.75, 5.08)),
    Wilaya(number: 7, nameAr: 'بسكرة', nameEn: 'Biskra', coordinate: LatLng(34.85, 5.73)),
    Wilaya(number: 8, nameAr: 'بشار', nameEn: 'Béchar', coordinate: LatLng(31.62, -2.22)),
    Wilaya(number: 9, nameAr: 'البليدة', nameEn: 'Blida', coordinate: LatLng(36.47, 2.82)),
    Wilaya(number: 10, nameAr: 'البويرة', nameEn: 'Bouira', coordinate: LatLng(36.37, 3.90)),
    Wilaya(number: 11, nameAr: 'تمنراست', nameEn: 'Tamanrasset', coordinate: LatLng(22.78, 5.52)),
    Wilaya(number: 12, nameAr: 'تبسة', nameEn: 'Tébessa', coordinate: LatLng(35.40, 8.12)),
    Wilaya(number: 13, nameAr: 'تلمسان', nameEn: 'Tlemcen', coordinate: LatLng(34.88, -1.31)),
    Wilaya(number: 14, nameAr: 'تيارت', nameEn: 'Tiaret', coordinate: LatLng(35.37, 1.32)),
    Wilaya(number: 15, nameAr: 'تيزي وزو', nameEn: 'Tizi Ouzou', coordinate: LatLng(36.72, 4.05)),
    Wilaya(number: 16, nameAr: 'الجزائر', nameEn: 'Alger', coordinate: LatLng(36.75, 3.06)),
    Wilaya(number: 17, nameAr: 'الجلفة', nameEn: 'Djelfa', coordinate: LatLng(34.67, 3.25)),
    Wilaya(number: 18, nameAr: 'جيجل', nameEn: 'Jijel', coordinate: LatLng(36.80, 5.77)),
    Wilaya(number: 19, nameAr: 'سطيف', nameEn: 'Sétif', coordinate: LatLng(36.19, 5.41)),
    Wilaya(number: 20, nameAr: 'سعيدة', nameEn: 'Saïda', coordinate: LatLng(34.83, 0.15)),
    Wilaya(number: 21, nameAr: 'سكيكدة', nameEn: 'Skikda', coordinate: LatLng(36.88, 6.90)),
    Wilaya(number: 22, nameAr: 'سيدي بلعباس', nameEn: 'Sidi Bel Abbès', coordinate: LatLng(35.20, -0.63)),
    Wilaya(number: 23, nameAr: 'عنابة', nameEn: 'Annaba', coordinate: LatLng(36.90, 7.76)),
    Wilaya(number: 24, nameAr: 'قالمة', nameEn: 'Guelma', coordinate: LatLng(36.46, 7.43)),
    Wilaya(number: 25, nameAr: 'قسنطينة', nameEn: 'Constantine', coordinate: LatLng(36.36, 6.61)),
    Wilaya(number: 26, nameAr: 'المدية', nameEn: 'Médéa', coordinate: LatLng(36.26, 2.75)),
    Wilaya(number: 27, nameAr: 'مستغانم', nameEn: 'Mostaganem', coordinate: LatLng(35.93, 0.09)),
    Wilaya(number: 28, nameAr: 'المسيلة', nameEn: 'M\'Sila', coordinate: LatLng(35.70, 4.54)),
    Wilaya(number: 29, nameAr: 'معسكر', nameEn: 'Mascara', coordinate: LatLng(35.40, 0.14)),
    Wilaya(number: 30, nameAr: 'ورقلة', nameEn: 'Ouargla', coordinate: LatLng(31.95, 5.32)),
    Wilaya(number: 31, nameAr: 'وهران', nameEn: 'Oran', coordinate: LatLng(35.69, -0.63)),
    Wilaya(number: 32, nameAr: 'البيض', nameEn: 'El Bayadh', coordinate: LatLng(33.68, 1.02)),
    Wilaya(number: 33, nameAr: 'إليزي', nameEn: 'Illizi', coordinate: LatLng(26.48, 8.48)),
    Wilaya(number: 34, nameAr: 'برج بوعريريج', nameEn: 'Bordj Bou Arréridj', coordinate: LatLng(36.07, 4.76)),
    Wilaya(number: 35, nameAr: 'بومرداس', nameEn: 'Boumerdès', coordinate: LatLng(36.76, 3.47)),
    Wilaya(number: 36, nameAr: 'الطارف', nameEn: 'El Tarf', coordinate: LatLng(36.76, 8.31)),
    Wilaya(number: 37, nameAr: 'تندوف', nameEn: 'Tindouf', coordinate: LatLng(27.67, -8.13)),
    Wilaya(number: 38, nameAr: 'تيسمسيلت', nameEn: 'Tissemsilt', coordinate: LatLng(35.60, 1.81)),
    Wilaya(number: 39, nameAr: 'الوادي', nameEn: 'El Oued', coordinate: LatLng(33.36, 6.85)),
    Wilaya(number: 40, nameAr: 'خنشلة', nameEn: 'Khenchela', coordinate: LatLng(35.43, 7.14)),
    Wilaya(number: 41, nameAr: 'سوق أهراس', nameEn: 'Souk Ahras', coordinate: LatLng(36.28, 7.95)),
    Wilaya(number: 42, nameAr: 'تيبازة', nameEn: 'Tipaza', coordinate: LatLng(36.59, 2.44)),
    Wilaya(number: 43, nameAr: 'ميلة', nameEn: 'Mila', coordinate: LatLng(36.45, 6.26)),
    Wilaya(number: 44, nameAr: 'عين الدفلى', nameEn: 'Aïn Defla', coordinate: LatLng(36.26, 2.02)),
    Wilaya(number: 45, nameAr: 'النعامة', nameEn: 'Naâma', coordinate: LatLng(33.26, -0.31)),
    Wilaya(number: 46, nameAr: 'عين تموشنت', nameEn: 'Aïn Témouchent', coordinate: LatLng(35.30, -1.14)),
    Wilaya(number: 47, nameAr: 'غرداية', nameEn: 'Ghardaïa', coordinate: LatLng(32.48, 3.67)),
    Wilaya(number: 48, nameAr: 'غليزان', nameEn: 'Relizane', coordinate: LatLng(35.74, 0.55)),
    Wilaya(number: 49, nameAr: 'المغير', nameEn: 'El M\'Ghair', coordinate: LatLng(33.95, 5.92)),
    Wilaya(number: 50, nameAr: 'المنيعة', nameEn: 'El Meniaa', coordinate: LatLng(30.58, 2.87)),
    Wilaya(number: 51, nameAr: 'أولاد جلال', nameEn: 'Ouled Djellal', coordinate: LatLng(34.42, 5.06)),
    Wilaya(number: 52, nameAr: 'برج باجي مختار', nameEn: 'Bordj Baji Mokhtar', coordinate: LatLng(21.33, 0.95)),
    Wilaya(number: 53, nameAr: 'بني عباس', nameEn: 'Béni Abbès', coordinate: LatLng(30.08, -2.17)),
    Wilaya(number: 54, nameAr: 'تيميمون', nameEn: 'Timimoun', coordinate: LatLng(29.25, 0.23)),
    Wilaya(number: 55, nameAr: 'تقرت', nameEn: 'Touggourt', coordinate: LatLng(33.10, 6.06)),
    Wilaya(number: 56, nameAr: 'جانت', nameEn: 'Djanet', coordinate: LatLng(24.55, 9.48)),
    Wilaya(number: 57, nameAr: 'عين صالح', nameEn: 'In Salah', coordinate: LatLng(27.20, 2.47)),
    Wilaya(number: 58, nameAr: 'عين قزام', nameEn: 'In Guezzam', coordinate: LatLng(19.57, 5.77)),
  ];

  @override
  void dispose() {
    _pickupController.dispose();
    _deliveryController.dispose();
    _mapController.dispose();
    super.dispose();
  }

  void _zoomToRoute() {
    if (_pickupWilaya != null && _deliveryWilaya != null) {
      final bounds = LatLngBounds.fromPoints([
        _pickupWilaya!.coordinate,
        _deliveryWilaya!.coordinate,
      ]);
      _mapController.fitCamera(
        CameraFit.bounds(
          bounds: bounds,
          padding: const EdgeInsets.fromLTRB(50, 100, 50, 360),
        ),
      );
    } else if (_pickupWilaya != null) {
      _mapController.move(_pickupWilaya!.coordinate, 12);
    } else if (_deliveryWilaya != null) {
      _mapController.move(_deliveryWilaya!.coordinate, 12);
    }
  }

  void _showWilayaSelectionSheet(bool isPickup) {
    String searchQuery = '';

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            final filteredWilayas = _wilayas.where((w) {
              final query = searchQuery.toLowerCase();
              return w.nameAr.contains(query) ||
                  w.nameEn.toLowerCase().contains(query) ||
                  w.number.toString().contains(query);
            }).toList();

            return Directionality(
              textDirection: TextDirection.rtl,
              child: Container(
                height: MediaQuery.of(context).size.height * 0.75,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  children: [
                    // Handle
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Title
                    Text(
                      isPickup ? 'اختر ولاية الاستلام' : 'اختر ولاية التفريغ',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Search input
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: TextField(
                        onChanged: (val) {
                          setModalState(() {
                            searchQuery = val;
                          });
                        },
                        decoration: const InputDecoration(
                          hintText: 'بحث عن ولاية...',
                          hintStyle: TextStyle(color: Colors.grey),
                          border: InputBorder.none,
                          icon: Icon(Icons.search, color: Colors.grey),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Wilaya list
                    Expanded(
                      child: ListView.builder(
                        itemCount: filteredWilayas.length,
                        itemBuilder: (context, index) {
                          final wilaya = filteredWilayas[index];
                          return ListTile(
                            onTap: () {
                              setState(() {
                                if (isPickup) {
                                  _pickupWilaya = wilaya;
                                  _pickupController.text = wilaya.displayName;
                                } else {
                                  _deliveryWilaya = wilaya;
                                  _deliveryController.text = wilaya.displayName;
                                }
                              });
                              Navigator.pop(context);
                              _zoomToRoute();
                            },
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.blue.shade50,
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                wilaya.number.toString().padLeft(2, '0'),
                                style: TextStyle(
                                  color: Colors.blue.shade700,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            title: Text(
                              wilaya.nameAr,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                            subtitle: Text(
                              wilaya.nameEn,
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 13,
                              ),
                            ),
                            trailing: const Icon(Icons.chevron_right_rounded),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Generate route points if both selected
    final List<LatLng> routePoints = [];
    if (_pickupWilaya != null && _deliveryWilaya != null) {
      routePoints.addAll([
        _pickupWilaya!.coordinate,
        _deliveryWilaya!.coordinate,
      ]);
    }

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: Stack(
          children: [
            // Real OSM Interactive Map Background
            Positioned.fill(
              child: FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: const LatLng(36.19, 5.41), // Setif center
                  initialZoom: 11,
                  minZoom: 4,
                  maxZoom: 19,
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.example.rafik_app',
                  ),
                  if (routePoints.isNotEmpty)
                    PolylineLayer(
                      polylines: [
                        Polyline(
                          points: routePoints,
                          strokeWidth: 6,
                          color: Colors.blue.shade600,
                        ),
                      ],
                    ),
                  MarkerLayer(
                    markers: [
                      if (_pickupWilaya != null)
                        Marker(
                          point: _pickupWilaya!.coordinate,
                          width: 40,
                          height: 40,
                          child: const Icon(
                            Icons.location_on_rounded,
                            color: Colors.red,
                            size: 38,
                          ),
                        ),
                      if (_deliveryWilaya != null)
                        Marker(
                          point: _deliveryWilaya!.coordinate,
                          width: 40,
                          height: 40,
                          child: const Icon(
                            Icons.location_on_rounded,
                            color: Colors.black,
                            size: 38,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),

            // Top Header overlay with back icon
            Positioned(
              top: MediaQuery.of(context).padding.top + 16,
              right: 16,
              child: GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black12,
                        blurRadius: 8,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.arrow_forward,
                    color: Colors.black87,
                    size: 24,
                  ),
                ),
              ),
            ),

            // Bottom Sheet address controls
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 16,
                      offset: Offset(0, -4),
                    ),
                  ],
                ),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: SafeArea(
                  top: false,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Handle/Drag bar
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Saved routes info line
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.bookmark_border_rounded,
                                color: Colors.red.shade600,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'لا توجد مسارات محفوظة',
                                style: TextStyle(
                                  color: Colors.black87,
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          GestureDetector(
                            onTap: () {},
                            child: Text(
                              'عرض القائمة',
                              style: TextStyle(
                                color: Colors.blue.shade600,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Pickup Address Card Input (Selecting Wilaya)
                      GestureDetector(
                        onTap: () => _showWilayaSelectionSheet(true),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9FAFB),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.location_on_rounded,
                                color: Colors.red,
                                size: 22,
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'عنوان استلام البضائع',
                                      style: TextStyle(
                                        color: Colors.grey.shade500,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      _pickupController.text.isNotEmpty
                                          ? _pickupController.text
                                          : 'اختر ولاية الاستلام',
                                      style: TextStyle(
                                        color: _pickupController.text.isNotEmpty ? Colors.black : Colors.grey,
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(
                                Icons.search,
                                color: Colors.grey,
                                size: 18,
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Delivery Address Card Input (Selecting Wilaya)
                      GestureDetector(
                        onTap: () => _showWilayaSelectionSheet(false),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9FAFB),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.location_on_rounded,
                                color: Colors.black87,
                                size: 22,
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'عنوان تسليم البضائع',
                                      style: TextStyle(
                                        color: Colors.grey.shade500,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      _deliveryController.text.isNotEmpty
                                          ? _deliveryController.text
                                          : 'مكان التفريغ (اختر ولاية)',
                                      style: TextStyle(
                                        color: _deliveryController.text.isNotEmpty ? Colors.black : Colors.grey,
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(
                                Icons.search,
                                color: Colors.grey,
                                size: 18,
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Continue Button (مواصلة)
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: (_pickupWilaya == null || _deliveryWilaya == null)
                              ? null
                              : () {
                                  Navigator.push(
                                    context,
                                    SmoothPageRoute(
                                      page: ParcelDetailsPage(
                                        selectedVehicle: widget.selectedVehicle,
                                        pickupAddress: _pickupController.text,
                                        deliveryAddress: _deliveryController.text,
                                      ),
                                    ),
                                  );
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.black,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: Colors.grey.shade200,
                            disabledForegroundColor: Colors.grey.shade400,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(26),
                            ),
                            elevation: 0,
                          ),
                          child: const Text(
                            'مواصلة',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 10),

                      // Save Template Button (الحفظ كنموذج رحلة متكرر)
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: OutlinedButton(
                          onPressed: () {},
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.black87,
                            side: BorderSide(color: Colors.grey.shade200, width: 1.5),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(26),
                            ),
                            elevation: 0,
                          ),
                          child: const Text(
                            'الحفظ كنموذج رحلة متكرر',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
