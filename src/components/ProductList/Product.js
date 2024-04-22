// components/ProductList/Product.js
import React from 'react';

const Product = ({ product, onDelete }) => {
  return (
    <li>
      {product.name} - {product.price}
      <button onClick={onDelete}>Delete</button>
    </li>
  );
};

export default Product;
