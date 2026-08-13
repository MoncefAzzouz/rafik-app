import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

/// A network image cached to disk/memory after the first load (so re-opening
/// the app doesn't re-download everything from scratch), with a shimmer
/// placeholder while it's in flight instead of a blank box.
class CachedImage extends StatelessWidget {
  final String url;
  final Widget Function(BuildContext context) errorBuilder;
  final BoxFit fit;
  final double? width;
  final double? height;

  const CachedImage({
    super.key,
    required this.url,
    required this.errorBuilder,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      imageUrl: url,
      fit: fit,
      width: width,
      height: height,
      placeholder: (context, url) => Shimmer.fromColors(
        baseColor: Colors.grey.shade200,
        highlightColor: Colors.grey.shade100,
        child: Container(width: width, height: height, color: Colors.white),
      ),
      errorWidget: (context, url, error) => errorBuilder(context),
    );
  }
}
