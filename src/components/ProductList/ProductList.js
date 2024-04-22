// components/ProductList/ProductList.js
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { fetchProducts, deleteProduct } from '../../store/actions';
import Product from './Product';

const ProductList = ({ products, fetchProducts, deleteProduct }) => {
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div>
      <h2>Product List</h2>
      <ul>
        {products.map(product => (
          <Product key={product.id} product={product} onDelete={() => deleteProduct(product.id)} />
        ))}
      </ul>
    </div>
  );
};

const mapStateToProps = state => ({
  products: state.products
});

export default connect(mapStateToProps, { fetchProducts, deleteProduct })(ProductList);
