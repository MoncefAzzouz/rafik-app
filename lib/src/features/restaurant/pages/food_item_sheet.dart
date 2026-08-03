import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class FoodItemSheet extends StatefulWidget {
  final String name;
  final String description;
  final int price;
  final String image;
  final void Function(int totalPrice, int quantity) onAddToCart;

  const FoodItemSheet({
    super.key,
    required this.name,
    required this.description,
    required this.price,
    required this.image,
    required this.onAddToCart,
  });

  @override
  State<FoodItemSheet> createState() => _FoodItemSheetState();
}

class _FoodItemSheetState extends State<FoodItemSheet> {
  int _quantity = 1;

  // Bread options
  final List<Map<String, dynamic>> _breadOptions = [
    {'name': 'Pain nature', 'extra': 0, 'selected': false},
    {'name': 'Pain fromage', 'extra': 50, 'selected': false},
    {'name': 'Pain complet', 'extra': 30, 'selected': false},
  ];

  // Meat options
  final List<Map<String, dynamic>> _meatOptions = [
    {'name': 'Poulet menthe', 'selected': false},
    {'name': 'Mexicain', 'selected': false},
    {'name': 'Indien', 'selected': false},
    {'name': 'Escalope grillée', 'selected': false},
  ];

  // Sauce options
  final List<Map<String, dynamic>> _sauceOptions = [
    {'name': 'Mayonnaise', 'selected': false},
    {'name': 'Ketchup', 'selected': false},
    {'name': 'Sauce blanche', 'selected': false},
    {'name': 'Harissa', 'selected': false},
    {'name': 'Moutarde', 'selected': false},
  ];

  int get _extrasTotal {
    int total = 0;
    for (final opt in _breadOptions) {
      if (opt['selected'] == true) {
        total += (opt['extra'] as int);
      }
    }
    return total;
  }

  int get _totalPrice => (widget.price + _extrasTotal) * _quantity;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag Handle
          Container(
            margin: const EdgeInsets.only(top: 10),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Scrollable Content
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hero Image with Close Button
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(20),
                        ),
                        child: Image.network(
                          widget.image,
                          height: 240,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              height: 240,
                              color: Colors.grey.shade100,
                              child: const Icon(
                                Icons.fastfood_rounded,
                                color: AppColors.textSecondary,
                                size: 60,
                              ),
                            );
                          },
                        ),
                      ),
                      Positioned(
                        top: 16,
                        right: 16,
                        child: GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            width: 36,
                            height: 36,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black12,
                                  blurRadius: 6,
                                  offset: Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.close_rounded,
                              color: Colors.black87,
                              size: 20,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Item Info
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 6),
                    child: Text(
                      widget.name,
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text(
                      '${widget.price} DA',
                      style: const TextStyle(
                        color: Color(0xFF1E523A),
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 6, 20, 20),
                    child: Text(
                      widget.description,
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                  ),

                  const Divider(height: 1, color: Color(0xFFF0F0F0)),

                  // Bread Options Section
                  _buildOptionSection(
                    title: 'Choisissez votre pain !',
                    subtitle: 'Select at least 1 option(s)',
                    isRequired: true,
                    options: _breadOptions,
                    showExtras: true,
                  ),

                  const Divider(height: 1, color: Color(0xFFF0F0F0)),

                  // Meat Options Section
                  _buildOptionSection(
                    title: 'Choisissez votre viande',
                    subtitle: 'Select at least 1 option(s)',
                    isRequired: true,
                    options: _meatOptions,
                    showExtras: false,
                  ),

                  const Divider(height: 1, color: Color(0xFFF0F0F0)),

                  // Sauce Options Section
                  _buildOptionSection(
                    title: 'Choisissez votre sauce',
                    subtitle: 'Optional',
                    isRequired: false,
                    options: _sauceOptions,
                    showExtras: false,
                  ),

                  // Bottom space so content is not hidden by fixed bar
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),

          // Fixed Bottom Bar: Quantity + Add to Cart
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  // Quantity Selector
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(30),
                    ),
                    child: Row(
                      children: [
                        IconButton(
                          onPressed: () {
                            if (_quantity > 1) {
                              setState(() => _quantity--);
                            }
                          },
                          icon: Icon(
                            Icons.remove_rounded,
                            color: _quantity > 1
                                ? Colors.black87
                                : Colors.grey.shade400,
                            size: 20,
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 40,
                            minHeight: 40,
                          ),
                        ),
                        Text(
                          '$_quantity',
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            setState(() => _quantity++);
                          },
                          icon: const Icon(
                            Icons.add_rounded,
                            color: Colors.black87,
                            size: 20,
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 40,
                            minHeight: 40,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(width: 16),

                  // Add to Cart Button
                  Expanded(
                    child: SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () {
                          widget.onAddToCart(_totalPrice, _quantity);
                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00E676),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Add to cart',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '$_totalPrice DA',
                              style: const TextStyle(
                                fontSize: 15,
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
        ],
      ),
    );
  }

  Widget _buildOptionSection({
    required String title,
    required String subtitle,
    required bool isRequired,
    required List<Map<String, dynamic>> options,
    required bool showExtras,
  }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
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
              if (isRequired)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFEBEE),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'Required',
                    style: TextStyle(
                      color: Color(0xFFE53935),
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),

          const SizedBox(height: 12),

          // Option Checkboxes
          ...List.generate(options.length, (index) {
            final opt = options[index];
            return GestureDetector(
              onTap: () {
                setState(() {
                  options[index]['selected'] = !(opt['selected'] as bool);
                });
              },
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: opt['selected'] == true
                              ? const Color(0xFF1E523A)
                              : Colors.grey.shade300,
                          width: 2,
                        ),
                        color: opt['selected'] == true
                            ? const Color(0xFF1E523A)
                            : Colors.transparent,
                      ),
                      child: opt['selected'] == true
                          ? const Icon(
                              Icons.check_rounded,
                              color: Colors.white,
                              size: 14,
                            )
                          : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        opt['name'],
                        style: const TextStyle(
                          color: Colors.black87,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (showExtras && (opt['extra'] as int) > 0)
                      Text(
                        '${opt['extra']} DA',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

/// Helper function to show the food item customization sheet
void showFoodItemSheet(
  BuildContext context, {
  required String name,
  required String description,
  required int price,
  required String image,
  required void Function(int totalPrice, int quantity) onAddToCart,
}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => FoodItemSheet(
      name: name,
      description: description,
      price: price,
      image: image,
      onAddToCart: onAddToCart,
    ),
  );
}
