import 'package:flutter/cupertino.dart';
import '../theme.dart';

/// A scrolling page with iPhone-style pull to refresh: drag down from the
/// top, a spinner appears, and [onRefresh] reloads the data.
class RefreshList extends StatelessWidget {
  const RefreshList({super.key, required this.onRefresh, required this.children, this.padding = const EdgeInsets.symmetric(horizontal: S.page), this.top = 16});
  final Future<void> Function() onRefresh;
  final List<Widget> children;
  final EdgeInsets padding;
  /// Space above the content, under the status bar. Negative means none,
  /// for a page whose cover runs to the very top.
  final double top;

  @override
  Widget build(BuildContext context) {
    final pad = MediaQuery.of(context).padding;
    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
      slivers: [
        SliverToBoxAdapter(child: SizedBox(height: top < 0 ? 0 : pad.top + top)),
        CupertinoSliverRefreshControl(onRefresh: onRefresh),
        SliverPadding(
          padding: padding.copyWith(bottom: pad.bottom + 110),
          sliver: SliverList(delegate: SliverChildListDelegate(children)),
        ),
      ],
    );
  }
}
