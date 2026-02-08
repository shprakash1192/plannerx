from __future__ import annotations

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    PrimaryKeyConstraint,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base  # adjust if your Base import differs


class Dimension(Base):
    __tablename__ = "dimensions"

    company_id = Column(
        BigInteger,
        ForeignKey("companies.company_id", ondelete="CASCADE"),
        nullable=False,
    )

    # IMPORTANT: composite PK -> SQLAlchemy won't autoincrement unless you specify server_default
    dimension_id = Column(
        BigInteger,
        nullable=False,
        server_default=text("nextval('dimensions_dimension_id_seq'::regclass)"),
    )

    dimension_key = Column(Text, nullable=False)
    dimension_name = Column(Text, nullable=False)

    # existing columns in your DB
    applies_to = Column(Text, nullable=False, server_default=text("'ALL'"))
    is_hierarchical = Column(Boolean, nullable=False, server_default=text("false"))

    description = Column(Text, nullable=True)
    data_type = Column(Text, nullable=False, server_default=text("'TEXT'"))
    is_active = Column(Boolean, nullable=False, server_default=text("true"))

    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        PrimaryKeyConstraint("company_id", "dimension_id", name="dimensions_pkey"),
        UniqueConstraint("company_id", "dimension_key", name="dimensions_company_id_dimension_key_key"),
        CheckConstraint("data_type IN ('TEXT','NUMBER','DATE')", name="chk_dimensions_data_type"),
        Index("ix_dimensions_company_key", "company_id", "dimension_key"),
    )

    values = relationship(
        "DimensionValue",
        back_populates="dimension",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class DimensionValue(Base):
    __tablename__ = "dimension_values"

    company_id = Column(
        BigInteger,
        ForeignKey("companies.company_id", ondelete="CASCADE"),
        nullable=False,
    )

    dimension_id = Column(BigInteger, nullable=False)

    # IMPORTANT: your DB shows this uses dimension_members_member_id_seq
    dimension_value_id = Column(
        BigInteger,
        nullable=False,
        server_default=text("nextval('dimension_members_member_id_seq'::regclass)"),
    )

    value_key = Column(Text, nullable=False)
    value_name = Column(Text, nullable=False)

    parent_value_id = Column(BigInteger, nullable=True)
    sort_order = Column(Integer, nullable=True)

    attributes_json = Column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )

    is_active = Column(Boolean, nullable=False, server_default=text("true"))

    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        PrimaryKeyConstraint("company_id", "dimension_id", "dimension_value_id", name="dimension_values_pkey"),
        UniqueConstraint(
            "company_id",
            "dimension_id",
            "value_key",
            name="dimension_values_company_id_dimension_id_value_key_key",
        ),
        Index("ix_dimension_values_lookup", "company_id", "dimension_id", "value_key"),
        ForeignKeyConstraint(
            ["company_id", "dimension_id"],
            ["dimensions.company_id", "dimensions.dimension_id"],
            ondelete="CASCADE",
            name="dimension_members_company_id_dimension_id_fkey",
        ),
        ForeignKeyConstraint(
            ["company_id", "dimension_id", "parent_value_id"],
            ["dimension_values.company_id", "dimension_values.dimension_id", "dimension_values.dimension_value_id"],
            ondelete="SET NULL",
            name="dimension_members_company_id_dimension_id_parent_member_id_fkey",
            use_alter=True,
        ),
    )

    dimension = relationship("Dimension", back_populates="values")
    parent = relationship(
        "DimensionValue",
        remote_side=["company_id", "dimension_id", "dimension_value_id"],
        foreign_keys=[company_id, dimension_id, parent_value_id],
        post_update=True,
        uselist=False,
    )