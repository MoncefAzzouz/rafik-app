import 'package:flutter/material.dart';
import 'parcel_vehicle_select_page.dart'; // import TruckTypeOption
import 'parcel_success_page.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/smooth_page_route.dart';
import '../../auth/data/auth_repository.dart';
import '../data/parcel_order_repository.dart';
import '../domain/parcel_order.dart';

class ParcelSummaryPage extends StatefulWidget {
  final String categoryId;
  final String categoryName;
  final TruckTypeOption truckType;
  final String pickupAddress;
  final double? pickupLat;
  final double? pickupLng;
  final String destinationAddress;
  final double? destinationLat;
  final double? destinationLng;
  final String description;
  final String invoiceLabel;
  final String invoiceStatus;
  final String timingText;
  final String scheduledType;
  final DateTime? scheduledDate;

  const ParcelSummaryPage({
    super.key,
    required this.categoryId,
    required this.categoryName,
    required this.truckType,
    required this.pickupAddress,
    this.pickupLat,
    this.pickupLng,
    required this.destinationAddress,
    this.destinationLat,
    this.destinationLng,
    required this.description,
    required this.invoiceLabel,
    required this.invoiceStatus,
    required this.timingText,
    required this.scheduledType,
    this.scheduledDate,
  });

  @override
  State<ParcelSummaryPage> createState() => _ParcelSummaryPageState();
}

class _ParcelSummaryPageState extends State<ParcelSummaryPage> {
  bool _isSubmitting = false;

  bool _isQuoting = true;
  TruckQuote? _quote;
  String? _quoteError;

  @override
  void initState() {
    super.initState();
    // The estimate is part of the summary itself now — fetch it as soon as the
    // page opens instead of hiding it behind a button.
    _fetchQuote();
  }

  Future<void> _fetchQuote() async {
    setState(() {
      _isQuoting = true;
      _quote = null;
      _quoteError = null;
    });

    final result = await ParcelOrderRepository.instance.quote(
      truckTypeId: widget.truckType.id,
      pickupLat: widget.pickupLat,
      pickupLng: widget.pickupLng,
      destinationLat: widget.destinationLat,
      destinationLng: widget.destinationLng,
    );

    if (!mounted) return;

    result.fold(
      onSuccess: (quote) => setState(() {
        _isQuoting = false;
        _quote = quote;
      }),
      onFailure: (failure) => setState(() {
        _isQuoting = false;
        _quoteError = failure.message;
      }),
    );
  }

  String _formatPrice(num? price) {
    if (price == null) return '—';
    final rounded = price.round();
    final str = rounded.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buffer.write(',');
      buffer.write(str[i]);
    }
    return '$buffer DZD';
  }

  Future<void> _submitOrder() async {
    final user = AuthRepository.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يرجى تسجيل الدخول لإرسال الطلب')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final result = await ParcelOrderRepository.instance.create(
      clientName: user.fullName,
      clientPhone: user.phone,
      categoryId: widget.categoryId,
      truckTypeId: widget.truckType.id,
      pickupAddress: widget.pickupAddress,
      pickupLat: widget.pickupLat,
      pickupLng: widget.pickupLng,
      destinationAddress: widget.destinationAddress,
      destinationLat: widget.destinationLat,
      destinationLng: widget.destinationLng,
      description: widget.description,
      invoiceStatus: widget.invoiceStatus,
      scheduledType: widget.scheduledType,
      scheduledDate: widget.scheduledDate,
    );

    if (!mounted) return;

    result.fold(
      onSuccess: (order) {
        Navigator.push(
          context,
          SmoothPageRoute(page: ParcelSuccessPage(orderId: order.orderNumber)),
        );
      },
      onFailure: (failure) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(failure.message)));
      },
    );
  }

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
                      // The estimate leads the summary — it's the number the
                      // user is here to check before committing.
                      _buildQuoteCard(),
                      const SizedBox(height: 24),

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
                                    widget.pickupAddress,
                                    style: const TextStyle(
                                      color: Colors.black87,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 24),
                                  Text(
                                    widget.destinationAddress,
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
                              widget.truckType.name,
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
                              widget.description.isNotEmpty
                                  ? widget.description
                                  : 'شحنة طرود',
                            ),
                            const SizedBox(height: 16),
                            _buildInfoRow(
                              'التاريخ والوقت',
                              widget.timingText,
                              valueColor:
                                  widget.timingText == 'في القريب العاجل'
                                  ? AppColors.primary
                                  : Colors.black,
                            ),
                            const SizedBox(height: 16),
                            _buildInfoRow('فاتورة', widget.invoiceLabel),
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
                    // إرسال الطلب (Send Request)
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submitOrder,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(26),
                          ),
                          elevation: 0,
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
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

  /// The estimated price, shown inline as part of the summary. Loading and
  /// failure are rendered in the same slot so the layout never jumps.
  Widget _buildQuoteCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.primary.withAlpha(10),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withAlpha(60)),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.price_check_rounded,
            color: AppColors.primary,
            size: 26,
          ),
          const SizedBox(width: 14),
          Expanded(child: _buildQuoteContent()),
        ],
      ),
    );
  }

  Widget _buildQuoteContent() {
    if (_isQuoting) {
      return Row(
        children: [
          const SizedBox(
            height: 18,
            width: 18,
            child: CircularProgressIndicator(strokeWidth: 2.2),
          ),
          const SizedBox(width: 12),
          Text(
            'جارٍ حساب السعر التقديري...',
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 13,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      );
    }

    if (_quoteError != null) {
      return Row(
        children: [
          Expanded(
            child: Text(
              _quoteError!,
              style: TextStyle(
                color: Colors.grey.shade700,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: _fetchQuote,
            style: TextButton.styleFrom(
              foregroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text(
              'إعادة المحاولة',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      );
    }

    final price = _quote?.estimatedPrice;
    if (price == null) {
      return Text(
        'السعر التقديري غير متوفر لهذا المسار',
        style: TextStyle(
          color: Colors.grey.shade700,
          fontSize: 13,
          fontWeight: FontWeight.bold,
        ),
      );
    }

    // Distance only shows when the backend actually returned it — an empty
    // line reads worse than no line.
    final distanceKm = _quote?.distanceKm;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'السعر التقديري',
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          _formatPrice(price),
          style: const TextStyle(
            color: AppColors.primary,
            fontSize: 20,
            fontWeight: FontWeight.w900,
          ),
        ),
        if (distanceKm != null) ...[
          const SizedBox(height: 4),
          Text(
            '${distanceKm.toStringAsFixed(1)} كم',
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ],
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
