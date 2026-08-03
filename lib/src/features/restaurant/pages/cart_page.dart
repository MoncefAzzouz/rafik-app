import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class CartItem {
  final String name;
  final String description;
  final int unitPrice;
  final String image;
  int quantity;

  CartItem({
    required this.name,
    required this.description,
    required this.unitPrice,
    required this.image,
    this.quantity = 1,
  });

  int get totalPrice => unitPrice * quantity;
}

class CartPage extends StatefulWidget {
  final String restaurantName;
  final List<CartItem> items;

  const CartPage({
    super.key,
    required this.restaurantName,
    required this.items,
  });

  @override
  State<CartPage> createState() => _CartPageState();
}

class _CartPageState extends State<CartPage>
    with SingleTickerProviderStateMixin {
  int _selectedDelivery = 2; // 0=priority, 1=standard, 2=schedule
  String _paymentMethod = 'CASH';
  double _swipeProgress = 0.0;
  bool _isValidating = false;

  int get _subtotal {
    int total = 0;
    for (final item in widget.items) {
      total += item.totalPrice;
    }
    return total;
  }

  int get _platformFees => (_subtotal * 0.07).round(); // 7%
  int get _deliveryCharges =>
      _selectedDelivery == 0 ? 345 : 195; // priority costs more
  int get _total => _subtotal + _platformFees + _deliveryCharges;

  void _removeItem(int index) {
    setState(() {
      widget.items.removeAt(index);
    });
    if (widget.items.isEmpty) {
      Navigator.pop(context);
    }
  }

  void _clearCart() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Vider le panier ?',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        content: const Text(
          'Tous les articles seront supprimés.',
          style: TextStyle(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Annuler',
              style: TextStyle(
                color: Colors.grey.shade600,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text(
              'Confirmer',
              style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          // Top App Bar
          Container(
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 8,
              left: 16,
              right: 16,
              bottom: 12,
            ),
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Icon(
                    Icons.arrow_back_ios_new_rounded,
                    color: AppColors.deepNavy,
                    size: 20,
                  ),
                ),
                const Text(
                  'Cart',
                  style: TextStyle(
                    color: AppColors.deepNavy,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                GestureDetector(
                  onTap: _clearCart,
                  child: const Icon(
                    Icons.delete_outline_rounded,
                    color: AppColors.deepNavy,
                    size: 22,
                  ),
                ),
              ],
            ),
          ),

          // Scrollable Content
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product & Restaurant Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Product',
                              style: TextStyle(
                                color: Colors.black,
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '🔥 ${widget.restaurantName}',
                              style: TextStyle(
                                color: Colors.grey.shade600,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: const Text(
                            '+ Add',
                            style: TextStyle(
                              color: AppColors.royalBlue,
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Delivery Address
                  _buildSectionRow(
                    icon: Icons.location_on_rounded,
                    iconColor: AppColors.deepNavy,
                    title: 'Delivery address',
                    subtitle: 'Setif, Algeria',
                    onTap: () {},
                  ),

                  const Divider(height: 1, color: Color(0xFFF2F2F2)),

                  // Cart Items List
                  ListView.separated(
                    physics: const NeverScrollableScrollPhysics(),
                    shrinkWrap: true,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                    itemCount: widget.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = widget.items[index];
                      return _buildCartItem(item, index);
                    },
                  ),

                  const Divider(height: 1, color: Color(0xFFF2F2F2)),

                  // Add your comment
                  _buildActionRow(title: 'Add your comment here', onTap: () {}),

                  const Divider(height: 1, color: Color(0xFFF2F2F2)),

                  // Send to someone else
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 16,
                    ),
                    child: GestureDetector(
                      onTap: () {},
                      behavior: HitTestBehavior.opaque,
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Send to someone else',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Add their details to help the rider',
                                  style: TextStyle(
                                    color: Colors.grey.shade500,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            Icons.chevron_right_rounded,
                            color: Colors.grey.shade400,
                            size: 24,
                          ),
                        ],
                      ),
                    ),
                  ),

                  const Divider(height: 1, color: Color(0xFFF2F2F2)),

                  // Delivery Options
                  const Padding(
                    padding: EdgeInsets.fromLTRB(20, 20, 20, 14),
                    child: Text(
                      'Delivery options',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        _buildDeliveryOption(
                          index: 0,
                          icon: Icons.bolt_rounded,
                          iconColor: Colors.amber,
                          label: 'Priority',
                          subtitle: '15-20 min',
                          extra: '+ 150 DA',
                          hasInfo: true,
                        ),
                        const SizedBox(width: 10),
                        _buildDeliveryOption(
                          index: 1,
                          icon: Icons.access_time_rounded,
                          iconColor: Colors.grey.shade400,
                          label: 'Standard',
                          subtitle: 'Not available',
                          isDisabled: true,
                        ),
                        const SizedBox(width: 10),
                        _buildDeliveryOption(
                          index: 2,
                          icon: Icons.calendar_month_rounded,
                          iconColor: AppColors.deepNavy,
                          label: 'Schedule',
                          subtitle: 'Choose time',
                        ),
                      ],
                    ),
                  ),

                  const Divider(height: 32, color: Color(0xFFF2F2F2)),

                  // Add Promocode
                  _buildActionRow(title: 'Add promocode', onTap: () {}),

                  const Divider(height: 1, color: Color(0xFFF2F2F2)),

                  const SizedBox(height: 32),

                  // Order Details
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Order details',
                          style: TextStyle(
                            color: Colors.black,
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 14),
                        _buildOrderRow('Subtotal', '$_subtotal DA'),
                        const SizedBox(height: 8),
                        _buildOrderRow(
                          'Platform fees',
                          '$_platformFees DA',
                          hasInfo: true,
                        ),
                        const SizedBox(height: 8),
                        _buildOrderRow(
                          'Delivery charges',
                          '$_deliveryCharges DA',
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Total',
                              style: TextStyle(
                                color: AppColors.deepNavy,
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            Text(
                              '$_total DA',
                              style: const TextStyle(
                                color: AppColors.deepNavy,
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const Divider(height: 1, color: Color(0xFFF2F2F2)),

                  // Payment Method
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Payment method',
                          style: TextStyle(
                            color: Colors.black,
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 12),
                        GestureDetector(
                          onTap: () {
                            _showPaymentPicker();
                          },
                          behavior: HitTestBehavior.opaque,
                          child: Row(
                            children: [
                              Container(
                                width: 32,
                                height: 22,
                                decoration: BoxDecoration(
                                  color: AppColors.deepNavy.withAlpha(15),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Icon(
                                  Icons.payments_outlined,
                                  color: AppColors.deepNavy,
                                  size: 16,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  _paymentMethod,
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              Icon(
                                Icons.chevron_right_rounded,
                                color: Colors.grey.shade400,
                                size: 24,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Bottom spacing for swipe button
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),

          // Fixed Bottom: Swipe to Validate
          _buildSwipeToValidate(),
        ],
      ),
    );
  }

  // ── Cart Item Widget ──
  Widget _buildCartItem(CartItem item, int index) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Item Image
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: Image.network(
            item.image,
            width: 56,
            height: 56,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.fastfood_rounded,
                  color: AppColors.textSecondary,
                  size: 24,
                ),
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        // Item Details
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.name,
                style: const TextStyle(
                  color: Colors.black,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                item.description,
                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  height: 1.3,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                '${item.totalPrice} DA',
                style: const TextStyle(
                  color: AppColors.deepNavy,
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        // Delete + Quantity Controls
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            GestureDetector(
              onTap: () => _removeItem(index),
              child: Icon(
                Icons.delete_outline_rounded,
                color: Colors.grey.shade400,
                size: 20,
              ),
            ),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade200),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        if (item.quantity > 1) {
                          item.quantity--;
                        } else {
                          _removeItem(index);
                        }
                      });
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(6),
                      child: Icon(
                        Icons.remove_rounded,
                        color: Colors.grey.shade600,
                        size: 16,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text(
                      '${item.quantity}',
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        item.quantity++;
                      });
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(6),
                      child: Icon(
                        Icons.add_rounded,
                        color: Colors.grey.shade600,
                        size: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ── Section Row (Delivery address style) ──
  Widget _buildSectionRow({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: iconColor, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.black,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: Colors.grey.shade500,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: Colors.grey.shade400,
              size: 24,
            ),
          ],
        ),
      ),
    );
  }

  // ── Simple Action Row ──
  Widget _buildActionRow({required String title, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: const TextStyle(
                color: Colors.black,
                fontSize: 15,
                fontWeight: FontWeight.w800,
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              color: Colors.grey.shade400,
              size: 24,
            ),
          ],
        ),
      ),
    );
  }

  // ── Delivery Option Card ──
  Widget _buildDeliveryOption({
    required int index,
    required IconData icon,
    required Color iconColor,
    required String label,
    required String subtitle,
    String? extra,
    bool isDisabled = false,
    bool hasInfo = false,
  }) {
    final bool isSelected = _selectedDelivery == index;
    return Expanded(
      child: GestureDetector(
        onTap: isDisabled
            ? null
            : () {
                setState(() => _selectedDelivery = index);
              },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.deepNavy.withAlpha(8) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? AppColors.deepNavy : Colors.grey.shade200,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Icon(icon, color: iconColor, size: 20),
                  if (extra != null)
                    Text(
                      extra,
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: isDisabled ? Colors.grey.shade400 : Colors.black,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (hasInfo) ...[
                    const SizedBox(width: 2),
                    Icon(
                      Icons.info_outline_rounded,
                      color: Colors.grey.shade400,
                      size: 12,
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  color: isDisabled
                      ? Colors.grey.shade300
                      : Colors.grey.shade500,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Order Row ──
  Widget _buildOrderRow(String label, String value, {bool hasInfo = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Text(
              label,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (hasInfo) ...[
              const SizedBox(width: 4),
              Icon(
                Icons.info_outline_rounded,
                color: Colors.grey.shade400,
                size: 14,
              ),
            ],
          ],
        ),
        Text(
          value,
          style: TextStyle(
            color: Colors.grey.shade700,
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  // ── Swipe to Validate Button ──
  Widget _buildSwipeToValidate() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade100)),
      ),
      child: SafeArea(
        top: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final double maxWidth = constraints.maxWidth;
            final double thumbSize = 52;
            final double maxDrag = maxWidth - thumbSize;

            return GestureDetector(
              onHorizontalDragUpdate: (details) {
                setState(() {
                  _swipeProgress = (_swipeProgress + details.delta.dx / maxDrag)
                      .clamp(0.0, 1.0);
                });
              },
              onHorizontalDragEnd: (details) {
                if (_swipeProgress > 0.85) {
                  final navigator = Navigator.of(context);
                  final messenger = ScaffoldMessenger.of(context);
                  setState(() {
                    _isValidating = true;
                    _swipeProgress = 1.0;
                  });
                  // Simulate order placement
                  Future.delayed(const Duration(seconds: 2), () {
                    if (mounted) {
                      navigator.pop();
                      messenger.showSnackBar(
                        SnackBar(
                          content: const Text(
                            'Commande confirmée ! 🎉',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          backgroundColor: AppColors.royalBlue,
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      );
                    }
                  });
                } else {
                  setState(() {
                    _swipeProgress = 0.0;
                  });
                }
              },
              child: Container(
                height: 56,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF00E676), Color(0xFF00C853)],
                  ),
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Stack(
                  children: [
                    // Label
                    Center(
                      child: AnimatedOpacity(
                        duration: const Duration(milliseconds: 150),
                        opacity: _isValidating
                            ? 0.0
                            : (1 - _swipeProgress * 1.5).clamp(0.0, 1.0),
                        child: const Text(
                          'Swipe to validate',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    // Swipeable thumb
                    if (!_isValidating)
                      Positioned(
                        left: _swipeProgress * maxDrag,
                        top: 2,
                        child: Container(
                          width: thumbSize,
                          height: thumbSize,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black12,
                                blurRadius: 4,
                                offset: Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.chevron_right_rounded,
                            color: Color(0xFF00C853),
                            size: 28,
                          ),
                        ),
                      ),
                    // Loading spinner when validating
                    if (_isValidating)
                      const Center(
                        child: SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 3,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  void _showPaymentPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: const EdgeInsets.all(20),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
                const Text(
                  'Payment method',
                  style: TextStyle(
                    color: Colors.black,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 16),
                _buildPaymentOption('CASH', Icons.payments_outlined),
                _buildPaymentOption('CIB / DAHABIA', Icons.credit_card_rounded),
                _buildPaymentOption('BARIDI MOB', Icons.phone_android_rounded),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildPaymentOption(String method, IconData icon) {
    final isSelected = _paymentMethod == method;
    return GestureDetector(
      onTap: () {
        setState(() => _paymentMethod = method);
        Navigator.pop(context);
      },
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: Color(0xFFF5F5F5))),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 26,
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.deepNavy.withAlpha(15)
                    : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Icon(
                icon,
                color: isSelected ? AppColors.deepNavy : Colors.grey.shade500,
                size: 18,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                method,
                style: TextStyle(
                  color: isSelected ? AppColors.deepNavy : Colors.black87,
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                ),
              ),
            ),
            if (isSelected)
              const Icon(
                Icons.check_circle_rounded,
                color: AppColors.royalBlue,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
}
