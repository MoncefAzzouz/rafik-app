import 'package:flutter/material.dart';
import 'parcel_vehicle_select_page.dart'; // import VehicleType
import 'parcel_success_page.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/smooth_page_route.dart';
import '../data/parcel_order_repository.dart';
import '../domain/parcel_order.dart';

class ParcelSummaryPage extends StatelessWidget {
  final VehicleType selectedVehicle;
  final String pickupAddress;
  final String deliveryAddress;
  final String description;
  final String invoiceOption;
  final String timingText;
  final int helperCount;

  const ParcelSummaryPage({
    super.key,
    required this.selectedVehicle,
    required this.pickupAddress,
    required this.deliveryAddress,
    required this.description,
    required this.invoiceOption,
    required this.timingText,
    required this.helperCount,
  });

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: const Icon(
                            Icons.arrow_back,
                            color: Colors.black87,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        const Text(
                          'طلب جديد',
                          style: TextStyle(
                            color: Colors.black,
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.popUntil(context, (route) => route.isFirst);
                      },
                      child: Text(
                        'إلغاء',
                        style: TextStyle(
                          color: Colors.blue.shade600,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Section 1: مسار الرحلة (Route Path)
                      _buildSummarySectionHeader(
                        'مسار الرحلة',
                        onEdit: () => Navigator.pop(context),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.grey.shade100),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Timeline dots
                            Column(
                              children: [
                                const SizedBox(height: 4),
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(
                                    color: AppColors.primary,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                Container(
                                  width: 1.5,
                                  height: 36,
                                  color: Colors.grey.shade300,
                                ),
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(
                                    color: Colors.black,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    pickupAddress,
                                    style: const TextStyle(
                                      color: Colors.black87,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 24),
                                  Text(
                                    deliveryAddress,
                                    style: const TextStyle(
                                      color: Colors.black87,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Section 2: معلومات المركبة (Vehicle Info)
                      _buildSummarySectionHeader(
                        'معلومات المركبة',
                        onEdit: () => Navigator.pop(context),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.grey.shade100),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'نوع المركبة',
                              style: TextStyle(
                                color: Colors.grey.shade500,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              selectedVehicle.name,
                              style: const TextStyle(
                                color: Colors.black,
                                fontSize: 14,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Section 3: نوع البضاعة والموعد (Goods & Timing)
                      _buildSummarySectionHeader(
                        'نوع البضاعة والموعد',
                        onEdit: () => Navigator.pop(context),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.grey.shade100),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildInfoRow(
                              'سلعة',
                              description.isNotEmpty
                                  ? description
                                  : 'شحنة طرود',
                            ),
                            const SizedBox(height: 16),
                            _buildInfoRow(
                              'التاريخ والوقت',
                              timingText,
                              valueColor: timingText == 'في القريب العاجل'
                                  ? AppColors.primary
                                  : Colors.black,
                            ),
                            const SizedBox(height: 16),
                            _buildInfoRow(
                              'مساعدين التحميل',
                              helperCount > 0 ? '$helperCount عمال' : 'لا يوجد',
                            ),
                            const SizedBox(height: 16),
                            _buildInfoRow('فاتورة', invoiceOption),
                          ],
                        ),
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),

              // Bottom Control Buttons
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // متوسط الأسعار (Average Prices)
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: OutlinedButton(
                        onPressed: () {},
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.black87,
                          side: BorderSide(
                            color: Colors.grey.shade200,
                            width: 1.5,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(26),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'متوسط الأسعار',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // إرسال الطلب (Send Request)
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: () {
                          // Build order ID and go to Success screen
                          final orderId =
                              'DZA${DateTime.now().millisecondsSinceEpoch.toString().substring(3, 13)}';

                          // Create new order and add it to active list
                          final newOrder = ParcelOrder(
                            id: orderId,
                            vehicleName: selectedVehicle.name,
                            pickup: pickupAddress,
                            delivery: deliveryAddress,
                            description: description,
                            timing: timingText,
                            helpers: helperCount,
                            invoice: invoiceOption,
                            dateCreated: DateTime.now(),
                          );
                          ParcelOrderRepository.instance.add(newOrder);

                          Navigator.push(
                            context,
                            SmoothPageRoute(
                              page: ParcelSuccessPage(orderId: orderId),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(26),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'إرسال الطلب',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummarySectionHeader(
    String title, {
    required VoidCallback onEdit,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Colors.black,
            fontSize: 16,
            fontWeight: FontWeight.w900,
          ),
        ),
        GestureDetector(
          onTap: onEdit,
          child: Text(
            'تعديل',
            style: TextStyle(
              color: Colors.blue.shade600,
              fontSize: 13,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? valueColor}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey.shade500,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: valueColor ?? Colors.black,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
