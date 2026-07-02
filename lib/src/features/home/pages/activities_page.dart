import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../taxi/pages/taxi_booking_page.dart';
import '../../restaurant/pages/food_page.dart';

class ActivityItem {
  final String id;
  final String date;
  final String price;
  final String type; // 'Rides', 'Food', 'Shop', 'Market'
  final String status; // 'Completed', 'Scheduled', 'Cancelled'
  final String pickupName;
  final String pickupAddress;
  final String destinationName;
  final String destinationAddress;
  final String? storeName; // For Food/Shop/Market

  ActivityItem({
    required this.id,
    required this.date,
    required this.price,
    required this.type,
    required this.status,
    required this.pickupName,
    required this.pickupAddress,
    required this.destinationName,
    required this.destinationAddress,
    this.storeName,
  });
}

class ActivitiesPage extends StatefulWidget {
  const ActivitiesPage({super.key});

  @override
  State<ActivitiesPage> createState() => _ActivitiesPageState();
}

class _ActivitiesPageState extends State<ActivitiesPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedFilter = 'All';

  final List<String> _filters = ['All', 'Completed', 'Scheduled', 'Cancelled'];

  final List<ActivityItem> _activities = [
    // Rides Tab Items
    ActivityItem(
      id: '1',
      date: 'Jun 27, 2026 at 12:16',
      price: '220,0 DZD',
      type: 'Rides',
      status: 'Completed',
      pickupName: 'Pickup',
      pickupAddress: '3Q5Q+Q83 pont, Bordj Bou Arreridj, Algérie',
      destinationName: 'Destination',
      destinationAddress: '2RRC+2FQ SAIDANI frère, Cité, El Anasser, Algérie',
    ),
    ActivityItem(
      id: '2',
      date: 'Jun 27, 2026 at 12:12',
      price: '220,0 DZD',
      type: 'Rides',
      status: 'Cancelled',
      pickupName: 'Pickup',
      pickupAddress: '3Q5Q+Q83 pont, Bordj Bou Arreridj, Algérie',
      destinationName: 'Destination',
      destinationAddress: '2RRC+2FQ SAIDANI frère, Cité, El Anasser, Algérie',
    ),
    ActivityItem(
      id: '3',
      date: 'Jul 01, 2026 at 09:30',
      price: '350,0 DZD',
      type: 'Rides',
      status: 'Scheduled',
      pickupName: 'Pickup',
      pickupAddress: 'Setif City Center, Setif, Algérie',
      destinationName: 'Destination',
      destinationAddress: 'Park Mall Setif, Algérie',
    ),

    // Food Tab Items
    ActivityItem(
      id: '4',
      date: 'Jun 28, 2026 at 19:45',
      price: '1,351 DA',
      type: 'Food',
      status: 'Completed',
      storeName: '🔥 KFC - City Center',
      pickupName: 'KFC - City Center',
      pickupAddress: 'Beb ezzouar, Bab Ezzouar, Algeria',
      destinationName: 'Delivery address',
      destinationAddress: 'Setif Residence, Setif, Algeria',
    ),
    ActivityItem(
      id: '5',
      date: 'Jun 29, 2026 at 13:15',
      price: '980 DA',
      type: 'Food',
      status: 'Cancelled',
      storeName: '🍕 Pizzeria Apollino',
      pickupName: 'Pizzeria Apollino',
      pickupAddress: 'Setif Boulevard, Algeria',
      destinationName: 'Delivery address',
      destinationAddress: 'Setif Residence, Setif, Algeria',
    ),

    // Shop/Market Tab Items
    ActivityItem(
      id: '6',
      date: 'Jun 30, 2026 at 10:00',
      price: '4,500 DA',
      type: 'Shop',
      status: 'Completed',
      storeName: '🛒 Uno Supermarket',
      pickupName: 'Uno Supermarket Mall',
      pickupAddress: 'Setif East highway, Algeria',
      destinationName: 'Delivery address',
      destinationAddress: 'Setif Residence, Setif, Algeria',
    ),
    ActivityItem(
      id: '7',
      date: 'Jul 02, 2026 at 14:00',
      price: '1,500 DA',
      type: 'Market',
      status: 'Completed',
      storeName: '⚡ Sofiane Rahmani (Electrician)',
      pickupName: 'Electrician Request',
      pickupAddress: 'Sofiane Rahmani Professional Office',
      destinationName: 'Service address',
      destinationAddress: 'Setif Center, Algeria',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<ActivityItem> _getFilteredItems(String tabType) {
    return _activities.where((item) {
      final matchesTab = item.type == tabType;
      final matchesFilter = _selectedFilter == 'All' || item.status == _selectedFilter;
      return matchesTab && matchesFilter;
    }).toList();
  }

  void _handleRequestAgain(ActivityItem item) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Re-ordering: ${item.storeName ?? "Ride to ${item.destinationAddress.split(',')[0]}"}'),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.royalBlue,
        action: SnackBarAction(
          label: 'GO',
          textColor: Colors.white,
          onPressed: () {
            if (item.type == 'Rides') {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const TaxiBookingPage()),
              );
            } else if (item.type == 'Food') {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const FoodPage()),
              );
            }
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFBFBFD),
      body: Column(
        children: [
          // Activity Header Section
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: AppColors.headerGradient,
            ),
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 16,
              bottom: 0,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: Text(
                    'Activity',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                // Tab Bar
                TabBar(
                  controller: _tabController,
                  indicatorColor: Colors.white,
                  indicatorWeight: 3,
                  labelColor: Colors.white,
                  unselectedLabelColor: Colors.white70,
                  labelStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                  unselectedLabelStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.normal,
                  ),
                  tabs: const [
                    Tab(text: 'Rides'),
                    Tab(text: 'Food'),
                    Tab(text: 'Shop'),
                    Tab(text: 'Market'),
                  ],
                ),
              ],
            ),
          ),

          // Filters and Content List
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Horizontal Status Filters
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: _filters.map((filter) {
                        final isSelected = _selectedFilter == filter;
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedFilter = filter;
                            });
                          },
                          child: Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.royalBlue : Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isSelected ? AppColors.royalBlue : Colors.grey.shade200,
                                width: 1,
                              ),
                              boxShadow: isSelected
                                  ? [
                                      BoxShadow(
                                        color: AppColors.royalBlue.withAlpha(50),
                                        blurRadius: 8,
                                        offset: const Offset(0, 3),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: Text(
                              filter,
                              style: TextStyle(
                                color: isSelected ? Colors.white : Colors.grey.shade600,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),

                // Tab Content List
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildTabList('Rides'),
                      _buildTabList('Food'),
                      _buildTabList('Shop'),
                      _buildTabList('Market'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabList(String tabType) {
    final items = _getFilteredItems(tabType);

    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.receipt_long_outlined,
              size: 64,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              'No previous $tabType activities found',
              style: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 110), // Bottom padding for floating navigation bar spacing
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        final isCompleted = item.status == 'Completed';
        final isCancelled = item.status == 'Cancelled';

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(6),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
            border: Border.all(
              color: Colors.grey.shade100,
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Card Top Header (Status indicator, date, price)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                child: Row(
                  children: [
                    // Status icon
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? Colors.green.shade50
                            : isCancelled
                                ? Colors.red.shade50
                                : Colors.blue.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isCompleted
                            ? Icons.check_rounded
                            : isCancelled
                                ? Icons.close_rounded
                                : Icons.calendar_month_rounded,
                        color: isCompleted
                            ? Colors.green.shade700
                            : isCancelled
                                ? Colors.red.shade700
                                : Colors.blue.shade700,
                        size: 16,
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Date
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.date,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (isCancelled)
                            const Text(
                              'Cancelled',
                              style: TextStyle(
                                color: Color(0xFFC62828),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          else if (item.status == 'Scheduled')
                            const Text(
                              'Scheduled',
                              style: TextStyle(
                                color: Color(0xFF1565C0),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                        ],
                      ),
                    ),
                    // Price
                    Text(
                      item.price,
                      style: TextStyle(
                        color: isCancelled ? Colors.grey.shade400 : AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        decoration: isCancelled ? TextDecoration.lineThrough : null,
                      ),
                    ),
                  ],
                ),
              ),

              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Divider(height: 1, color: Color(0xFFEEEEEE)),
              ),

              // Store Name indicator if applicable
              if (item.storeName != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Text(
                    item.storeName!,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),

              // Pickup / Destination Timeline
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Timeline dots & line
                    Column(
                      children: [
                        const SizedBox(height: 4),
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.pink, width: 2),
                            color: Colors.white,
                          ),
                        ),
                        Container(
                          width: 2,
                          height: 38,
                          color: Colors.grey.shade200,
                        ),
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.royalBlue, width: 2),
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 14),
                    // Addresses details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Pickup info
                          Text(
                            item.pickupName,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item.pickupAddress,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.grey.shade500,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 18),
                          // Destination info
                          Text(
                            item.destinationName,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item.destinationAddress,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.grey.shade500,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Request again / Reorder button
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: OutlinedButton(
                    onPressed: () => _handleRequestAgain(item),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(22),
                      ),
                      side: BorderSide(color: Colors.grey.shade200),
                      foregroundColor: AppColors.royalBlue,
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.refresh_rounded, size: 16),
                        SizedBox(width: 6),
                        Text(
                          'Request again',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
