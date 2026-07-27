import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'parcel_vehicle_select_page.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/utils/smooth_page_route.dart';

class ParcelOrder {
  final String id;
  final String vehicleName;
  final String pickup;
  final String delivery;
  final String description;
  final String timing;
  final int helpers;
  final String invoice;
  final DateTime dateCreated;
  bool isCompleted;
  bool isCancelled;

  ParcelOrder({
    required this.id,
    required this.vehicleName,
    required this.pickup,
    required this.delivery,
    required this.description,
    required this.timing,
    required this.helpers,
    required this.invoice,
    required this.dateCreated,
    this.isCompleted = false,
    this.isCancelled = false,
  });
}

class ParcelDashboardPage extends StatefulWidget {
  const ParcelDashboardPage({super.key});

  // Static lists for persistent mock database
  static final List<ParcelOrder> activeOrders = [];
  static final List<ParcelOrder> archivedOrders = [];

  @override
  State<ParcelDashboardPage> createState() => _ParcelDashboardPageState();
}

class _ParcelDashboardPageState extends State<ParcelDashboardPage> {
  bool _isLoading = true;
  int _currentTabIndex = 0; // 0 for الرئيسية, 1 for الأرشيف

  @override
  void initState() {
    super.initState();
    _simulateLoading();
  }

  void _simulateLoading() {
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    });
  }

  void _navigateToCreateRequest() {
    Navigator.push(
      context,
      SmoothPageRoute(
        page: const ParcelVehicleSelectPage(),
      ),
    ).then((_) {
      // Rebuild when returning to dashboard to reflect new orders
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<AppLang>(
      valueListenable: AppLanguage.instance,
      builder: (context, lang, _) {
        final s = AppStrings(lang);
        return Directionality(
          textDirection: AppLanguage.instance.textDirection,
          child: Scaffold(
            backgroundColor: Colors.white,
            body: SafeArea(
              child: _isLoading
                  ? _buildShimmerLoading()
                  : Column(
                      children: [
                        // Custom Header
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              GestureDetector(
                                onTap: () => Navigator.pop(context),
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.grey.shade100,
                                  ),
                                  child: const Icon(
                                    Icons.arrow_back,
                                    color: Colors.black87,
                                    size: 20,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              // Profile picture (MA brand gradient)
                              Container(
                                width: 44,
                                height: 44,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: LinearGradient(
                                    colors: [AppColors.royalBlue, AppColors.electricBlue],
                                  ),
                                ),
                                child: const Center(
                                  child: Text(
                                    'MA',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              // Title text
                              Text(
                                '${s.hello}, Moncef!',
                                style: const TextStyle(
                                  color: Colors.black,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                          // Notification bell icon
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.grey.shade100,
                            ),
                            child: const Icon(
                              Icons.notifications_none_rounded,
                              color: Colors.black87,
                              size: 22,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Main Content depending on selected tab index
                    Expanded(
                      child: _currentTabIndex == 0
                          ? _buildHomeTabContent(s)
                          : _buildArchiveTabContent(s),
                    ),
                  ],
                ),
            ),
            // Custom Bottom bar
            bottomNavigationBar: _isLoading
                ? null
                : SafeArea(
                    child: Container(
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border(top: BorderSide(color: Colors.grey.shade100, width: 1)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          // Home tab
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _currentTabIndex = 0),
                              child: Container(
                                color: Colors.transparent,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.home_rounded,
                                        color: _currentTabIndex == 0 ? AppColors.primary : Colors.grey.shade400,
                                        size: 26),
                                    const SizedBox(height: 4),
                                    Text(
                                      s.parcelTabHome,
                                      style: TextStyle(
                                        color: _currentTabIndex == 0 ? AppColors.primary : Colors.grey.shade500,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),

                          // FAB
                          GestureDetector(
                            onTap: _navigateToCreateRequest,
                            child: Container(
                              width: 56,
                              height: 56,
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 4))],
                              ),
                              child: const Icon(Icons.add, color: Colors.white, size: 28),
                            ),
                          ),

                          // Archive tab
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _currentTabIndex = 1),
                              child: Container(
                                color: Colors.transparent,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.history_rounded,
                                        color: _currentTabIndex == 1 ? AppColors.primary : Colors.grey.shade400,
                                        size: 26),
                                    const SizedBox(height: 4),
                                    Text(
                                      s.parcelTabArchive,
                                      style: TextStyle(
                                        color: _currentTabIndex == 1 ? AppColors.primary : Colors.grey.shade500,
                                        fontSize: 12,
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
                    ),
                  ),
          ),
        );
      },
    );
  }

  // TAB 1: Home / Active Orders Content
  Widget _buildHomeTabContent(AppStrings s) {
    if (ParcelDashboardPage.activeOrders.isEmpty) {
      return SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: 230),
            Text(
              s.parcelEmpty,
              style: const TextStyle(color: Colors.black, fontSize: 22, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                s.parcelEmptyHint,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey.shade600, fontSize: 14, height: 1.6, fontWeight: FontWeight.w500),
              ),
            ),
            const SizedBox(height: 40),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _navigateToCreateRequest,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                    elevation: 0,
                  ),
                  child: Text(s.parcelCreateOrder, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Active orders list view
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 10),
      itemCount: ParcelDashboardPage.activeOrders.length,
      itemBuilder: (context, index) {
        final order = ParcelDashboardPage.activeOrders[index];
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.grey.shade100, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(8),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: ID and Finding Driver Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.inventory_2_outlined, color: Colors.blue, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        order.id,
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      'جاري البحث عن عروض...',
                      style: TextStyle(
                        color: Colors.orange.shade800,
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),

              // Route path details
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      const SizedBox(height: 4),
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                      Container(
                        width: 1.5,
                        height: 26,
                        color: Colors.grey.shade300,
                      ),
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: Colors.black,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.pickup,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          order.delivery,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),

              // Detail Badges
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildDetailBadge('المركبة', order.vehicleName),
                  _buildDetailBadge('العمال', order.helpers > 0 ? '${order.helpers} أشخاص' : 'لا يوجد'),
                  _buildDetailBadge('الوقت', order.timing.split(' ').first),
                ],
              ),
              const SizedBox(height: 18),

              // Complete / Cancel actions
              Row(
                children: [
                  // Cancel Button
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() {
                          order.isCancelled = true;
                          ParcelDashboardPage.activeOrders.remove(order);
                          ParcelDashboardPage.archivedOrders.add(order);
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('تم إلغاء الطلب بنجاح')),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red.shade600,
                        side: BorderSide(color: Colors.red.shade100, width: 1.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'إلغاء الطلب',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Complete Button
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() {
                          order.isCompleted = true;
                          ParcelDashboardPage.activeOrders.remove(order);
                          ParcelDashboardPage.archivedOrders.add(order);
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('تم إكمال شحن الطرد وتوصيله بنجاح!')),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'إتمام التوصيل',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  // TAB 2: Archive Content
  Widget _buildArchiveTabContent(AppStrings s) {
    if (ParcelDashboardPage.archivedOrders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Colors.grey.shade50, shape: BoxShape.circle),
              child: Icon(Icons.archive_outlined, size: 64, color: Colors.grey.shade400),
            ),
            const SizedBox(height: 16),
            Text(
              s.parcelArchiveEmpty,
              style: const TextStyle(color: Colors.black, fontSize: 18, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            Text(
              s.parcelEmptyHint,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 10),
      itemCount: ParcelDashboardPage.archivedOrders.length,
      itemBuilder: (context, index) {
        final order = ParcelDashboardPage.archivedOrders[index];
        final isCompleted = order.isCompleted;

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.grey.shade100, width: 1.5),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    order.id,
                    style: const TextStyle(
                      color: Colors.black87,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isCompleted ? Colors.green.shade50 : Colors.red.shade50,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      isCompleted ? 'مكتمل' : 'ملغي',
                      style: TextStyle(
                        color: isCompleted ? Colors.green.shade700 : Colors.red.shade700,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),

              // Route path
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      const SizedBox(height: 4),
                      Container(width: 5, height: 5, decoration: BoxDecoration(color: Colors.grey.shade400, shape: BoxShape.circle)),
                      Container(width: 1, height: 18, color: Colors.grey.shade200),
                      Container(width: 5, height: 5, decoration: BoxDecoration(color: Colors.grey.shade400, shape: BoxShape.circle)),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(order.pickup, style: TextStyle(fontSize: 12, color: Colors.grey.shade700, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 10),
                        Text(order.delivery, style: TextStyle(fontSize: 12, color: Colors.grey.shade700, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 20),

              // Reorder / Request Again
              SizedBox(
                width: double.infinity,
                height: 40,
                child: OutlinedButton(
                  onPressed: () {
                    // Copy to active list and show active tab
                    setState(() {
                      final reordered = ParcelOrder(
                        id: 'DZA${DateTime.now().millisecondsSinceEpoch.toString().substring(3, 13)}',
                        vehicleName: order.vehicleName,
                        pickup: order.pickup,
                        delivery: order.delivery,
                        description: order.description,
                        timing: 'في القريب العاجل',
                        helpers: order.helpers,
                        invoice: order.invoice,
                        dateCreated: DateTime.now(),
                      );
                      ParcelDashboardPage.activeOrders.add(reordered);
                      _currentTabIndex = 0;
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('تمت إعادة إرسال الطلب وإضافته للطلبات النشطة')),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.black87,
                    side: BorderSide(color: Colors.grey.shade200),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.replay_rounded, size: 16),
                      SizedBox(width: 6),
                      Text(
                        'إعادة الطلب',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailBadge(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.grey.shade400,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              color: Colors.black87,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Column(
        children: [
          // Header Shimmer
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      width: 120,
                      height: 18,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 60),
          // Graphic Shimmer
          Container(
            width: double.infinity,
            height: 200,
            margin: const EdgeInsets.symmetric(horizontal: 40),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
          ),
          const SizedBox(height: 40),
          // Text Shimmers
          Container(
            width: 150,
            height: 24,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: 250,
            height: 16,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            width: 200,
            height: 16,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 40),
          // Button Shimmer
          Container(
            width: double.infinity,
            height: 54,
            margin: const EdgeInsets.symmetric(horizontal: 20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
            ),
          ),
        ],
      ),
    );
  }
}
