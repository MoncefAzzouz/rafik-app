import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import 'food_item_sheet.dart';
import 'cart_page.dart';

class RestaurantDetailsPage extends StatefulWidget {
  final String restaurantName;
  final String restaurantImage;
  final String rating;
  final String reviewsCount;
  final String cuisineType;

  const RestaurantDetailsPage({
    super.key,
    required this.restaurantName,
    required this.restaurantImage,
    required this.rating,
    required this.reviewsCount,
    required this.cuisineType,
  });

  @override
  State<RestaurantDetailsPage> createState() => _RestaurantDetailsPageState();
}

class _RestaurantDetailsPageState extends State<RestaurantDetailsPage> {
  final TextEditingController _menuSearchController = TextEditingController();
  int _selectedTab = 0;
  final List<CartItem> _cartItems = [];

  int get _cartCount => _cartItems.fold(0, (sum, item) => sum + item.quantity);
  int get _cartTotal => _cartItems.fold(0, (sum, item) => sum + item.totalPrice);

  final List<String> _tabs = [
    'Nos Naans 🌮',
    'Nos Burgers 🍔',
    'Nos Tacos 🌯',
  ];

  final List<Map<String, dynamic>> _menuItems = [
    {
      'name': 'Composez votre Naan 🌮',
      'description': 'Pain au choix, viande au choix, sauce, crudités.',
      'price': 500,
      'image': 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=200',
    },
    {
      'name': 'Naan Chef',
      'description': 'Escalope de poulet champignons et crème fraîche, crudités au choix.',
      'price': 550,
      'image': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200',
    },
    {
      'name': 'Naan Boursin',
      'description': 'Escalope de poulet fromage ail et fines herbes, crudités au choix.',
      'price': 600,
      'image': 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=200',
    },
    {
      'name': 'Naan Delice',
      'description': 'Viande hachée, jambon de dinde et œuf, crudités au choix.',
      'price': 700,
      'image': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    },
    {
      'name': 'Naan Suisse',
      'description': 'Escalope de poulet sauce fromagère et jambon de dinde, crudités au choix.',
      'price': 650,
      'image': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200',
    },
    {
      'name': 'Naan 3 Fromages',
      'description': 'Escalope de poulet, sauce fromagère, camembert, slice, crudit...',
      'price': 700,
      'image': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200',
    },
  ];

  final List<Map<String, dynamic>> _reviews = [
    {
      'name': 'Omar',
      'date': 'June 9, 2026',
      'rating': 5,
      'text': 'Crousty sweet',
      'tag': '+5 products',
    },
    {
      'name': 'Yacine',
      'date': 'May 20, 2026',
      'rating': 5,
      'text': 'Très bon service et rapide !',
      'tag': '+2 products',
    },
  ];



  @override
  void dispose() {
    _menuSearchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Main scrollable content
          SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Cover Image
                Stack(
                  children: [
                    Image.network(
                      widget.restaurantImage,
                      height: 220,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          height: 220,
                          color: Colors.grey.shade100,
                          child: const Icon(
                            Icons.restaurant_rounded,
                            color: AppColors.textSecondary,
                            size: 60,
                          ),
                        );
                      },
                    ),
                    // Gradient shading overlay
                    Container(
                      height: 220,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withAlpha(80),
                            Colors.transparent,
                            Colors.black.withAlpha(120),
                          ],
                        ),
                      ),
                    ),
                    // Restaurant name overlayed on image bottom
                    Positioned(
                      bottom: 16,
                      left: 20,
                      right: 20,
                      child: Text(
                        widget.restaurantName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ),
                  ],
                ),

                // Delivery info block
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  child: Row(
                    children: [
                      // Delivery charges
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade200),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'Delivery charges',
                                    style: TextStyle(
                                      color: Colors.grey.shade500,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Icon(
                                    Icons.info_outline_rounded,
                                    color: Colors.grey.shade400,
                                    size: 14,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Text(
                                    'Free',
                                    style: TextStyle(
                                      color: Color(0xFF1E523A), // Dark Green
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    '195 DA',
                                    style: TextStyle(
                                      color: Colors.grey.shade400,
                                      fontSize: 12,
                                      decoration: TextDecoration.lineThrough,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Delivery time
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade200),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Delivery time',
                                style: TextStyle(
                                  color: Colors.grey.shade500,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                '30 - 40 min',
                                style: TextStyle(
                                  color: Colors.black,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Preorders Banner notice
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9), // Light green background
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.calendar_today_outlined,
                          color: Color(0xFF1E523A),
                          size: 18,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'This partner currently accepts pre-orders only.',
                            style: TextStyle(
                              color: Colors.green.shade900,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Search product field
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                  child: Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: TextField(
                      controller: _menuSearchController,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                      decoration: const InputDecoration(
                        hintText: 'Search for a product',
                        hintStyle: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                        prefixIcon: Icon(
                          Icons.search_rounded,
                          color: AppColors.textSecondary,
                          size: 20,
                        ),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                ),

                // Livraison gratuite Tag pill
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey.shade200),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          children: [
                            Icon(
                              Icons.local_offer_outlined,
                              color: Color(0xFF00E676),
                              size: 16,
                            ),
                            SizedBox(width: 8),
                            Text(
                              'Livraison gratuite',
                              style: TextStyle(
                                color: Colors.black87,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // "What people say" section
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'What people say',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      GestureDetector(
                        onTap: () {},
                        child: const Row(
                          children: [
                            Text(
                              'See all',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Icon(
                              Icons.chevron_right_rounded,
                              color: AppColors.textSecondary,
                              size: 16,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Reviews List
                SizedBox(
                  height: 110,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    itemCount: _reviews.length + 1, // First is the big score
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return Container(
                          width: 100,
                          margin: const EdgeInsets.symmetric(horizontal: 6),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                widget.rating,
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.black,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: List.generate(
                                  5,
                                  (i) => const Icon(
                                    Icons.star_rounded,
                                    color: Colors.amber,
                                    size: 10,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${widget.reviewsCount} reviews',
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        );
                      }

                      final review = _reviews[index - 1];
                      return Container(
                        width: 220,
                        margin: const EdgeInsets.symmetric(horizontal: 6),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade100),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  review['name'],
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    color: Colors.black87,
                                  ),
                                ),
                                Text(
                                  review['date'],
                                  style: const TextStyle(
                                    color: Colors.grey,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              children: List.generate(
                                review['rating'],
                                (i) => const Icon(
                                  Icons.star_rounded,
                                  color: Colors.amber,
                                  size: 12,
                                ),
                              ),
                            ),
                            Text(
                              review['text'],
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                review['tag'],
                                style: const TextStyle(
                                  color: Colors.grey,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 24),
                const Divider(height: 1, color: Color(0xFFEEEEEE)),

                // Menu Tabs
                Container(
                  height: 50,
                  width: double.infinity,
                  color: Colors.white,
                  child: Row(
                    children: [
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: Icon(
                          Icons.menu_rounded,
                          color: Colors.black87,
                          size: 20,
                        ),
                      ),
                      Expanded(
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _tabs.length,
                          itemBuilder: (context, index) {
                            final bool isSelected = _selectedTab == index;
                            return GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedTab = index;
                                });
                              },
                              child: Container(
                                alignment: Alignment.center,
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                decoration: BoxDecoration(
                                  border: Border(
                                    bottom: BorderSide(
                                      color: isSelected
                                          ? const Color(0xFF1E523A)
                                          : Colors.transparent,
                                      width: 2,
                                    ),
                                  ),
                                ),
                                child: Text(
                                  _tabs[index],
                                  style: TextStyle(
                                    color: isSelected
                                        ? const Color(0xFF1E523A)
                                        : Colors.grey.shade500,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                // Category Title "Nos Naans 🌮"
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                  child: Text(
                    _tabs[_selectedTab],
                    style: const TextStyle(
                      color: Colors.black,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),

                // Menu Vertical List
                ListView.builder(
                  physics: const NeverScrollableScrollPhysics(),
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _menuItems.length,
                  itemBuilder: (context, index) {
                    final item = _menuItems[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: const BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: Color(0xFFF5F5F5),
                              width: 1,
                            ),
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Left Text Details
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item['name'],
                                    style: const TextStyle(
                                      color: Colors.black,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    item['description'],
                                    style: TextStyle(
                                      color: Colors.grey.shade500,
                                      fontSize: 12,
                                      height: 1.3,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    '${item['price']} DA',
                                    style: const TextStyle(
                                      color: Color(0xFF1E523A), // Dark Green
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 16),
                            // Right Visual and Plus Add Button
                            Stack(
                              clipBehavior: Clip.none,
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Image.network(
                                    item['image'],
                                    width: 80,
                                    height: 80,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) {
                                      return Container(
                                        width: 80,
                                        height: 80,
                                        color: Colors.grey.shade100,
                                        child: const Icon(
                                          Icons.fastfood_rounded,
                                          color: AppColors.textSecondary,
                                        ),
                                      );
                                    },
                                  ),
                                ),
                                Positioned(
                                  bottom: -8,
                                  right: -8,
                                  child: GestureDetector(
                                    onTap: () {
                                      showFoodItemSheet(
                                        context,
                                        name: item['name'],
                                        description: item['description'],
                                        price: item['price'],
                                        image: item['image'],
                                        onAddToCart: (totalPrice, quantity) {
                                          setState(() {
                                            _cartItems.add(CartItem(
                                              name: item['name'],
                                              description: item['description'],
                                              unitPrice: totalPrice ~/ quantity,
                                              image: item['image'],
                                              quantity: quantity,
                                            ));
                                          });
                                        },
                                      );
                                    },
                                    child: Container(
                                      width: 28,
                                      height: 28,
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: Colors.grey.shade200,
                                          width: 1,
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withAlpha(12),
                                            blurRadius: 4,
                                            offset: const Offset(0, 2),
                                          ),
                                        ],
                                      ),
                                      child: const Icon(
                                        Icons.add_rounded,
                                        color: AppColors.royalBlue,
                                        size: 20,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 80), // bottom space for floating cart
              ],
            ),
          ),

          // Floating Close/Back Action Icon (Top-Left)
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            left: 16,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                width: 38,
                height: 38,
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
                  size: 22,
                ),
              ),
            ),
          ),

          // Floating Search Action Icon (Top-Right)
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            right: 16,
            child: GestureDetector(
              onTap: () {},
              child: Container(
                width: 38,
                height: 38,
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
                  Icons.search_rounded,
                  color: AppColors.royalBlue,
                  size: 22,
                ),
              ),
            ),
          ),

          // Bottom Floating Cart Summary (Only shows if items are added)
          if (_cartCount > 0)
            Positioned(
              bottom: 24,
              left: 20,
              right: 20,
              child: GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CartPage(
                        restaurantName: widget.restaurantName,
                        items: _cartItems,
                      ),
                    ),
                  ).then((_) => setState(() {}));
                },
                child: Container(
                  height: 54,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: AppColors.royalBlue,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.royalBlue.withAlpha(60),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white.withAlpha(40),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '$_cartCount',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            'View Cart',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '$_cartTotal DA',
                        style: const TextStyle(
                          color: Colors.white,
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
    );
  }
}
