import 'package:flutter/material.dart';
import 'parcel_vehicle_select_page.dart'; // import VehicleType
import 'parcel_summary_page.dart';
import '../../../core/utils/smooth_page_route.dart';

class ParcelDetailsPage extends StatefulWidget {
  final VehicleType selectedVehicle;
  final String pickupAddress;
  final String deliveryAddress;

  const ParcelDetailsPage({
    super.key,
    required this.selectedVehicle,
    required this.pickupAddress,
    required this.deliveryAddress,
  });

  @override
  State<ParcelDetailsPage> createState() => _ParcelDetailsPageState();
}

class _ParcelDetailsPageState extends State<ParcelDetailsPage> {
  final TextEditingController _descController = TextEditingController();
  final TextEditingController _dateController = TextEditingController(
    text: '2026/07/28',
  );
  int _selectedInvoiceOption = 2; // Default: 'هذه الخدمة لا تحتاج إلى فاتورة.'
  bool _isLater = true; // Default: 'لاحقاً'

  final List<String> _invoiceOptions = [
    'نعم عندي.',
    'لا، ليس لدي.',
    'هذه الخدمة لا تحتاج إلى فاتورة.',
  ];

  @override
  void dispose() {
    _descController.dispose();
    _dateController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Colors.blue.shade600, // header color
              onPrimary: Colors.white, // header text color
              onSurface: Colors.black87, // body text color
            ),
            textButtonTheme: TextButtonThemeData(
              style: TextButton.styleFrom(
                foregroundColor: Colors.blue.shade600,
              ),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _dateController.text =
            "${picked.year}/${picked.month.toString().padLeft(2, '0')}/${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  // Kept temporarily for reference; the order flow now skips helper selection.
  // ignore: unused_element
  void _showHelperSelectionSheet() {
    int localHelperCount = 1;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Directionality(
              textDirection: TextDirection.rtl,
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 20,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Handle
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

                    // Illustration of loading van
                    SizedBox(
                      height: 160,
                      child: Image.network(
                        'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400', // cargo loading mockup van
                        fit: BoxFit.contain,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Title
                    const Text(
                      'هل تحتاج إلى مساعدة في التحميل؟',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Description
                    Text(
                      'إذا كنت تحتاج إلى مساعدين في تحميل شحنتك، يمكنك إضافتهم هنا.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Counter Label
                    const Text(
                      'عدد عمال التحميل المطلوبين',
                      style: TextStyle(
                        color: Colors.black87,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Counter Widget (Blue border box)
                    Container(
                      width: 150,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(28),
                        border: Border.all(
                          color: Colors.blue.shade600,
                          width: 1.5,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Increment button (+)
                          GestureDetector(
                            onTap: () {
                              setModalState(() {
                                localHelperCount++;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.blue.shade600,
                              ),
                              child: const Icon(
                                Icons.add,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                          ),

                          // Text (e.g. 01)
                          Text(
                            localHelperCount.toString().padLeft(2, '0'),
                            style: const TextStyle(
                              color: Colors.black,
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                            ),
                          ),

                          // Decrement button (-)
                          GestureDetector(
                            onTap: () {
                              if (localHelperCount > 1) {
                                setModalState(() {
                                  localHelperCount--;
                                });
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.grey.shade300,
                              ),
                              child: const Icon(
                                Icons.remove,
                                color: Colors.black87,
                                size: 18,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Helper fees note
                    Text(
                      'سيشمل السعر الرسوم عمال التحميل',
                      style: TextStyle(
                        color: Colors.grey.shade400,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Button 1: حفظ ومتابعة
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(ctx); // Close sheet
                          _navigateToSummary(localHelperCount);
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
                          'حفظ ومتابعة',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Button 2: لا، لا أحتاج إلى مساعدين للتحميل
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.pop(ctx); // Close sheet
                          _navigateToSummary(0);
                        },
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
                          'لا، لا أحتاج إلى مساعدين للتحميل',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
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

  void _navigateToSummary(int helperCount) {
    final timing = _isLater
        ? 'لاحقاً (${_dateController.text})'
        : 'في القريب العاجل';
    Navigator.push(
      context,
      SmoothPageRoute(
        page: ParcelSummaryPage(
          selectedVehicle: widget.selectedVehicle,
          pickupAddress: widget.pickupAddress,
          deliveryAddress: widget.deliveryAddress,
          description: _descController.text,
          invoiceOption: _invoiceOptions[_selectedInvoiceOption],
          timingText: timing,
          helperCount: helperCount,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Stack(
            children: [
              Column(
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
                            Navigator.popUntil(
                              context,
                              (route) => route.isFirst,
                            );
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

                  // Subheader Banner
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.inventory_2_outlined,
                            color: Colors.orange,
                            size: 26,
                          ),
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'تفاصيل الشحنة',
                                style: TextStyle(
                                  color: Colors.black,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'يرجى تقديم تفاصيل واضحة لضمان أن أصحاب المركبات يفهمون طلبك',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Expanded scrollable form content
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Shipment description input
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: TextField(
                              controller: _descController,
                              maxLines: 3,
                              decoration: const InputDecoration(
                                hintText: 'أوصف الشحنة',
                                hintStyle: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                                border: InputBorder.none,
                              ),
                              style: const TextStyle(
                                color: Colors.black,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),

                          const SizedBox(height: 24),

                          // Invoice Question Label
                          const Text(
                            'هل عندك الفاتورة المطلوبة للشحنة؟',
                            style: TextStyle(
                              color: Colors.black,
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Radio options list
                          Column(
                            children: List.generate(_invoiceOptions.length, (
                              index,
                            ) {
                              final isSelected =
                                  _selectedInvoiceOption == index;
                              return GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _selectedInvoiceOption = index;
                                  });
                                },
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 14,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF9FAFB),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: isSelected
                                          ? Colors.blue.shade600
                                          : Colors.grey.shade200,
                                      width: isSelected ? 1.5 : 1,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 20,
                                        height: 20,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: isSelected
                                                ? Colors.blue.shade600
                                                : Colors.grey.shade400,
                                            width: isSelected ? 6 : 2,
                                          ),
                                          color: Colors.white,
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Text(
                                        _invoiceOptions[index],
                                        style: TextStyle(
                                          color: isSelected
                                              ? Colors.black
                                              : Colors.grey.shade700,
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }),
                          ),

                          const SizedBox(height: 24),

                          // Date & Time Header
                          const Text(
                            'التاريخ والوقت',
                            style: TextStyle(
                              color: Colors.black,
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Segment selector toggle ("الآن" / "لاحقاً")
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF2F2F2),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Row(
                              children: [
                                // الآن
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _isLater = false;
                                      });
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 12,
                                      ),
                                      decoration: BoxDecoration(
                                        color: !_isLater
                                            ? Colors.white
                                            : Colors.transparent,
                                        borderRadius: BorderRadius.circular(12),
                                        boxShadow: !_isLater
                                            ? [
                                                const BoxShadow(
                                                  color: Colors.black12,
                                                  blurRadius: 4,
                                                  offset: Offset(0, 2),
                                                ),
                                              ]
                                            : null,
                                      ),
                                      child: Center(
                                        child: Text(
                                          'الآن',
                                          style: TextStyle(
                                            color: !_isLater
                                                ? Colors.black
                                                : Colors.grey.shade600,
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                // لاحقاً
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _isLater = true;
                                      });
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 12,
                                      ),
                                      decoration: BoxDecoration(
                                        color: _isLater
                                            ? Colors.blue.shade600
                                            : Colors.transparent,
                                        borderRadius: BorderRadius.circular(12),
                                        boxShadow: _isLater
                                            ? [
                                                const BoxShadow(
                                                  color: Colors.black12,
                                                  blurRadius: 4,
                                                  offset: Offset(0, 2),
                                                ),
                                              ]
                                            : null,
                                      ),
                                      child: Center(
                                        child: Text(
                                          'لاحقاً',
                                          style: TextStyle(
                                            color: _isLater
                                                ? Colors.white
                                                : Colors.grey.shade600,
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Calendar field for Later option
                          if (_isLater)
                            GestureDetector(
                              onTap: _selectDate,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF9FAFB),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: Colors.grey.shade200,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: TextField(
                                        controller: _dateController,
                                        readOnly: true,
                                        onTap: _selectDate,
                                        decoration: const InputDecoration(
                                          hintText: 'أدخل التاريخ',
                                          hintStyle: TextStyle(
                                            color: Colors.grey,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                          ),
                                          border: InputBorder.none,
                                          isDense: true,
                                          contentPadding: EdgeInsets.zero,
                                        ),
                                        style: const TextStyle(
                                          color: Colors.black,
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    const Icon(
                                      Icons.calendar_month_outlined,
                                      color: Colors.grey,
                                      size: 20,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          const SizedBox(height: 40),
                        ],
                      ),
                    ),
                  ),

                  // Bottom Button (مواصلة)
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: () => _navigateToSummary(0),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(28),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'مواصلة',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
